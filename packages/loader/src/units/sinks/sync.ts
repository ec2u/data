/*
 * Copyright © 2020-2026 EC2U Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CommentLength, LabelLength } from "@ec2u/data-shared";
import { getPersonId, Person, persons } from "@ec2u/data-shared/persons/index.js";
import { getUnitId, Unit, units, Units } from "@ec2u/data-shared/units/index.js";
import type { University } from "@ec2u/data-shared/universities/index.core.js";
import type { State } from "@metreeca/blue/value";
import { opt } from "@metreeca/core";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray, toSet } from "@metreeca/flow/sinks";
import { distinct, filter, flat, fork, map, tee, trim } from "@metreeca/flow/tasks";
import { validate } from "@metreeca/mime-jsonld";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@metreeca/pipe-store";
import type { Reference } from "@metreeca/qest/state";
import { digest } from "@metreeca/work/core/digest.js";
import { classify, type Classified } from "../tasks/classify.js";
import { translate } from "../tasks/translate.js";


const analysis = 10; // the number of drafts translated and classified at the same time by the model // !!! as option

const survival = 0.75; // the smallest fraction of the stored units a sheet must account for // !!! as option


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A unit as read from a source, independent of the university listing it.
 *
 * The identifier is the key the source lists the unit under, and so are the identifiers of its parent units; the heads
 * are stated as the source names them. The sink resolves them and derives the label, the comment, the dataset and
 * university links, the digest and the classification, so a draft carries only what the source itself states.
 */
export type Draft = {

	readonly id: string

	readonly identifier?: string
	readonly isDefinedBy?: string

	readonly prefLabel: Dictionary
	readonly altLabel?: string
	readonly definition?: Dictionary

	readonly homepage: readonly string[]
	readonly mbox: readonly string[]

	/**
	 * The keys of the units the unit belongs to within the same listing; empty for a unit standing directly under its
	 * university, which the sink then states as its only parent besides the virtual institutes it takes part in.
	 */
	readonly unitOf: readonly string[]

	/**
	 * The identifiers of the virtual institutes the unit takes part in.
	 */
	readonly institutes: readonly Reference[]

	readonly heads: readonly Name[]

	/**
	 * The unit type and research topics the source states in its own words, as cues for the classification.
	 */
	readonly cues?: {
		readonly type?: string
		readonly topics?: string
	}

}

/**
 * A text stated in one or more languages, keyed by language tag.
 */
export type Dictionary = { readonly [tag: string]: string };

/**
 * A person as named by a source.
 */
export type Name = {

	readonly title?: string
	readonly givenName: string
	readonly familyName: string

}

/**
 * A draft left to complete, along with the digest it is recorded with once stated.
 */
export type Entry = {

	readonly hash: string
	readonly draft: Draft

}

/**
 * A classified entry along with the valid states of the people it names as heads.
 */
export type Staffed = Classified & {

	readonly people: readonly State<typeof Person>[]

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink keeping the units listed by a university in line with the listing, one unit at a time.
 *
 * Every unit is stated as it is drawn, each in a store operation of its own, so a run cut short keeps what it has
 * stated and the next one carries on from there. A draft whose digest matches the one recorded with the unit the store
 * already holds is dropped before it is completed, so an unchanged sheet costs a retrieval and a comparison per row;
 * under `force` every draft is completed and stated afresh, whatever the store holds.
 *
 * Completing a draft translates its name and description to English where the source states them only in the local
 * language, and tags the unit with its type from the EC2U organisation taxonomy and with up to three research subjects
 * from EuroSciVoc. A draft the model fails on is dropped and records no digest, so it is completed again on the next
 * run, while the unit the store holds for it, if any, is left in place. The heads a unit names are stated alongside it,
 * so the names they are shown with are held wherever the unit is; they are never retracted along with it, as other
 * resources, such as the documents of the same university, may name the same people as well. A head whose state fails
 * validation is logged and left out, and the unit is stated without it, so no unit links a person the store lacks.
 *
 * The units the store holds for the university and the feed never named are retracted once it has been drawn whole,
 * so nothing is retired on the strength of a partial reading. A feed listing fewer than three quarters of the stored
 * units retracts nothing and fails, so a truncated or unreachable sheet costs a run rather than the listing, while
 * the units the run already stated are kept as they were written, since each was committed on its own.
 *
 * @param university The university the units are attributed to
 *
 * @param options The options governing how drafts are stated
 * @param options.force Whether every draft is stated afresh, ignoring the digests of stored units; defaults to `false`
 *
 * @returns A sink drawing a feed of unit drafts and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored units, or if the store rejects a unit as invalid, with the units already stated kept
 */
export function sync(university: University, {

	force = false

}: {

	readonly force?: boolean

} = {}): Sink<Draft, Tally> {

	return drafts => pipe(
		(items(drafts))
		(tee(
			insert(),
			remove()
		))
		(settle())
	);


	function insert(): Task<Draft, Delta> {

		return drafts => {

			const digests = force ? new Set<string>() : pipe(
				(lookup({

					entry: units.id,
					shape: Units,

					model: { resources: { digest: {}, "?university": [university.id] } } // !!! DSL

				}))
				(map(unit => unit.digest))
				(trim())
				(toSet())
			);

			return pipe(
				(items(drafts))
				(map((draft): Entry => ({ hash: digest(draft), draft })))
				(filter(async ({ hash }) => !(await digests).has(hash)))
				(fork(analysis, drafts => pipe(
					(items(drafts))
					(translate(university))
					(classify())
				)))
				(map(staff))
				(tee(
					define(),
					heads()
				))
			);

		};


		/**
		 * Settles the people a draft names as heads, leaving out the ones that fail validation, so the unit links only
		 * people that are stated alongside it in the same run, never ones the store doesn't hold.
		 */
		async function staff(classified: Classified): Promise<Staffed> {
			return immutable({

				...classified,

				people: await pipe(
					(items(classified.draft.heads))
					(map(name => immutable({

						...name,

						id: person(name),

						dataset: persons.id,
						university: university.id,

						label: clip(`${name.givenName} ${name.familyName}`, LabelLength)

					})))
					(distinct(person => person.id))
					(validate(Person))
					(toArray())
				)

			});
		}

		function define(): Task<Staffed, Delta> {

			return staffed => pipe(
				(items(staffed))
				(map(complete))
				(validate(Unit))
				(map(unit => delta(unit.id, Unit, unit)))
			);


			function complete({

				hash,

				draft: {

					id,

					prefLabel,
					definition,

					unitOf,
					institutes,

					heads,

					cues,

					...draft

				},

				classification,
				subject,

				people

			}: Staffed) {

				return immutable({

					...draft,

					id: getUnitId(university.id, id),

					dataset: units.id,
					university: university.id,

					generated: true,

					label: Object.fromEntries(Object.entries(prefLabel).map(([tag, label]) =>
						[tag, clip(label, LabelLength)]
					)),

					comment: opt(definition, definition => Object.fromEntries(Object.entries(definition).map(([tag, text]) =>
						[tag, clip(text, CommentLength)]
					))),

					prefLabel,
					definition,

					unitOf: [
						...(unitOf.length === 0 ? [university.id] : unitOf.map(key => getUnitId(university.id, key))),
						...institutes
					],

					hasHead: people.map(({ id }) => id),

					classification,
					subject,

					digest: hash

				});

			}

		}

		function heads(): Task<Staffed, Delta> {
			return staffed => pipe(
				(items(staffed))
				(flat(map(({ people }) => people)))
				(distinct(person => person.id))
				(map(person => delta(person.id, Person, person)))
			);
		}

	}

	function remove(): Task<Draft, Delta> {

		return drafts => {

			const existing = pipe(
				(lookup({

					entry: units.id,
					shape: Units,

					model: { resources: { id: {}, "?university": [university.id] } } // !!! DSL

				}))
				(map(unit => unit.id))
			);

			return pipe(
				(items(drafts))
				(map(({ id }) => getUnitId(university.id, id)))
				(retire({ survival, existing }))
				(map(id => delta(id, Unit, null)))
			);

		};

	}


	function person({ familyName, givenName }: Name) {
		return getPersonId(university.id, familyName, givenName);
	}

}
