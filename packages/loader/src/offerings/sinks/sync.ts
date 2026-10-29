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
import { Course, courses, Courses, getCourseId } from "@ec2u/data-shared/courses/index.js";
import { getOrganizationId, Organization, organizations } from "@ec2u/data-shared/organizations/index.js";
import { getPersonId, Person, persons } from "@ec2u/data-shared/persons/index.js";
import { getProgramId, Program, programs, Programs } from "@ec2u/data-shared/programs/index.js";
import type { University } from "@ec2u/data-shared/universities/index.core.js";
import type { State } from "@metreeca/blue/value";
import { opt } from "@metreeca/core";
import { multiple, required } from "@metreeca/core/arrays";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { type Feed, pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray, toSet } from "@metreeca/flow/sinks";
import { distinct, filter, flat, fork, map, tee, trim, when } from "@metreeca/flow/tasks";
import { validate } from "@metreeca/mime-jsonld";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@metreeca/pipe-store";
import type { Reference } from "@metreeca/qest/state";
import { log, report } from "@metreeca/tape";
import { digest } from "@metreeca/work/core/digest.js";
import { classify } from "../tasks/classify.js";
import { translate } from "../tasks/translate.js";


const analysis = 10; // the number of drafts translated and classified at the same time by the model // !!! as option

const survival = 0.75; // the smallest fraction of the stored offerings a listing must account for // !!! as option


const logger = log(import.meta.url);


/**
 * An offering as read from a source, attributed to the partner university delivering it.
 *
 * The key is the one the source lists the offering under; along with the university, the academic year and, for
 * courses, the terms it is delivered in, it names the offering. Provider, instructors and programs are stated as the
 * source names them. The sink resolves them and derives the identifier, the label, the comment, the dataset, source
 * and university links, the digest and any educational level and field of education the source leaves out, so a draft
 * carries only the facts the source itself states, in the very terms and languages the source states them in.
 */
export type Draft = ProgramDraft | CourseDraft;

/**
 * A degree or vocational qualification program as read from a source.
 */
export type ProgramDraft = Omit<Program, Derived | "hasCourse"> & Drafted & {

	readonly kind: "program"

}

/**
 * A course as read from a source.
 */
export type CourseDraft = Omit<Course, Derived | "instructor" | "inProgram"> & Drafted & {

	readonly kind: "course"

	readonly instructor?: readonly Name[]

	/**
	 * The programs the course belongs to, named as the source lists them.
	 */
	readonly inProgram?: readonly Listing[]

}

/**
 * The facts every draft states in its own terms, in place of the ones the sink derives.
 */
type Drafted = {

	/**
	 * The university delivering the offering, supplying the language its local texts are written in.
	 */
	readonly university: University

	readonly key: string

	readonly name: Dictionary

	readonly provider?: Agency

	/**
	 * The educational level and field the source states in its own words, as cues for the classification.
	 */
	readonly cues?: {
		readonly level?: string
		readonly field?: string
	}

}

/**
 * The members of a stored offering derived by the sink rather than read from the source.
 */
type Derived =
	| "id"
	| "label"
	| "comment"
	| "dataset"
	| "university"
	| "generated"
	| "name"
	| "provider"
	| "source"
	| "digest"

/**
 * An offering as listed by a source, named by its key and the academic year it is delivered in.
 */
export type Listing = {

	readonly key: string
	readonly year?: string

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
 * An organisation as named by a source, in English, in the local language or both.
 */
export type Agency = {

	readonly name: Dictionary
	readonly homepage?: string

}

/**
 * A draft left to complete, along with the digest it is recorded with once stated.
 */
export type Entry = {

	readonly hash: string
	readonly draft: Draft

}

/**
 * A completed entry along with the valid states of the provider and the people it names.
 */
export type Attached = Entry & {

	readonly provider?: State<typeof Organization>
	readonly people: readonly State<typeof Person>[]

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink keeping the programs and courses listed by a source in line with the listing, one at a time.
 *
 * A source may list offerings for one university or for several, each draft naming the university delivering it, and
 * a university may be served by several sources: every offering records the source stating it, and a source states,
 * skips and retracts only the offerings it stated itself, leaving the ones other sources state untouched.
 *
 * Every offering is stated as it is drawn, each in a store operation of its own, so a run cut short keeps what it has
 * stated and the next one carries on from there. A draft whose digest matches the one recorded with the offering the
 * store already holds is dropped before it is completed, so an unchanged listing costs a retrieval and a comparison
 * per entry; under `force` every draft is completed and stated afresh, whatever the store holds. The remaining drafts
 * are then completed and stated along with their provider and instructors, as {@link complete} describes.
 *
 * The programs and courses the store holds for the source and the feed never named are retracted once it has been drawn
 * whole, as {@link retract} describes, so nothing is retired on the strength of a partial reading. A draft that cannot
 * be named, as its key is blank or its year malformed, is logged and dropped, and counts as unlisted.
 *
 * @param source The identifier of the source listing the offerings
 *
 * @param options The options governing how drafts are stated
 * @param options.force Whether every draft is stated afresh, ignoring stored digests; defaults to `false`
 *
 * @returns A sink drawing a feed of offering drafts and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored offerings, or if the store rejects an offering as invalid, with the offerings the run stated
 * before the failure kept in the store exactly as they were written, each committed on its own
 */
export function sync(source: Reference, {

	force = false

}: {

	readonly force?: boolean

} = {}): Sink<Draft, Tally> {

	return drafts => pipe(
		(items(drafts))
		(tee(
			drafts => {

				const digests = force ? new Set<string>() : stated(source);

				return pipe(
					(items(drafts))
					(filter(identified))
					(map((draft): Entry => ({ hash: digest(draft), draft })))
					(filter(async ({ hash }) => !(await digests).has(hash)))
					(complete(source))
				);

			},
			drafts => pipe(
				(items(drafts))
				(map(identify))
				(trim())
				(retract(source))
			)
		))
		(settle())
	);


	function identified(draft: Draft): boolean {

		if ( identify(draft) === undefined ) {

			logger.warning`unidentified ${draft.kind} <${draft.key}> at <${draft.university.id}> in <${draft.year}>`;

			return false;

		} else {

			return true;

		}

	}

}

/**
 * Retrieves the digests recorded with the programs and courses the store holds for a source.
 *
 * @param source The identifier of the source listing the offerings
 *
 * @returns A promise resolving to the digests of the stored offerings stated by `source`
 */
export async function stated(source: Reference): Promise<ReadonlySet<string>> {

	const [listed, taught] = await Promise.all([

		pipe(
			(lookup({

				entry: programs.id,
				shape: Programs,

				model: { resources: { digest: {}, "?source": [source] } } // !!! DSL

			}))
			(map(program => program.digest))
			(trim())
			(toSet())
		),

		pipe(
			(lookup({

				entry: courses.id,
				shape: Courses,

				model: { resources: { digest: {}, "?source": [source] } } // !!! DSL

			}))
			(map(course => course.digest))
			(trim())
			(toSet())
		)

	]);

	return new Set([...listed, ...taught]);

}

/**
 * Creates an offering completer.
 *
 * Completes each entry into the deltas stating its program or course, provider and instructors, recording the entry
 * digest with the offering. Completing a draft translates its texts to English where the source states them only in
 * the local language, and tags the offering with an ISCED 2011 educational level and an ISCED-F 2013 field where the
 * source states none. A draft the model fails on is dropped and records no digest, so it is completed again on the
 * next run, while the offering the store holds for it, if any, is left in place as the last successful run stated it.
 *
 * The provider and instructors an offering names are stated alongside it, so the names they are shown with are held
 * wherever the offering is; they are never retracted along with it, as other resources, such as the documents of the
 * same university, may name them as well. One whose state fails validation is logged and left out, and the offering
 * is stated without linking it, so no offering links a resource the store doesn't hold.
 *
 * @param source The identifier of the source listing the offerings
 *
 * @returns A task converting a feed of entries into a feed of deltas stating their offerings, providers and instructors
 */
export function complete(source: Reference): Task<Entry, Delta> {

	return entries => pipe(
		(items(entries))
		(fork(analysis, entries => pipe(
			(items(entries))
			(translate())
			(classify())
		)))
		(map(attach))
		(tee(
			define(),
			providers(),
			instructors()
		))
	);


	/**
	 * Settles the provider and the people a draft names, leaving out the ones that fail validation, so the offering
	 * links only resources that are stated alongside it in the same run, never ones the store doesn't hold.
	 */
	async function attach(entry: Entry): Promise<Attached> {

		const { draft } = entry;

		const [provider, people] = await Promise.all([

			pipe(
				(items([draft.provider]))
				(trim())
				(map(agency => organization(draft.university, agency)))
				(validate(Organization))
				(toArray())
			),

			pipe(
				(items(draft.kind === "course" ? draft.instructor ?? [] : []))
				(map(name => person(draft.university, name)))
				(distinct(person => person.id))
				(validate(Person))
				(toArray())
			)

		]);

		return immutable({ ...entry, provider: provider[0], people });

	}

	function define(): Task<Attached, Delta> {
		return attached => pipe(
			(items(attached))
			(when(({ draft }) => draft.kind === "program",
				programs => pipe(
					(items(programs))
					(map(attached => state(source, attached)))
					(validate(Program))
					(map((program): Delta => delta(program.id, Program, program)))
				),
				courses => pipe(
					(items(courses))
					(map(attached => state(source, attached)))
					(validate(Course))
					(map((course): Delta => delta(course.id, Course, course)))
				)
			))
		);
	}

	function providers(): Task<Attached, Delta> {
		return attached => pipe(
			(items(attached))
			(map(({ provider }) => provider))
			(trim())
			(distinct(organization => organization.id))
			(map(organization => delta(organization.id, Organization, organization)))
		);
	}

	function instructors(): Task<Attached, Delta> {
		return attached => pipe(
			(items(attached))
			(flat(map(({ people }) => people)))
			(distinct(person => person.id))
			(map(person => delta(person.id, Person, person)))
		);
	}

}

/**
 * Creates an offering retractor.
 *
 * Watches the identifiers a scan names and, once it has been drawn whole, retracts the programs and courses the store
 * holds for the source and the scan never named, so nothing is retired on the strength of a partial reading. A scan
 * naming fewer than three quarters of the stored offerings retracts nothing and fails, so a broken source costs a run.
 *
 * @param source The identifier of the source listing the offerings
 *
 * @returns A task converting a feed of offering identifiers into deltas retracting the offerings it never named
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored offerings of `source`, with nothing retracted by the run
 */
export function retract(source: Reference): Task<Reference, Delta> {

	return ids => {

		const existing: Feed<string> = flat(items([

			pipe(
				(lookup({

					entry: programs.id,
					shape: Programs,

					model: { resources: { id: {}, "?source": [source] } } // !!! DSL

				}))
				(map(program => program.id))
			),

			pipe(
				(lookup({

					entry: courses.id,
					shape: Courses,

					model: { resources: { id: {}, "?source": [source] } } // !!! DSL

				}))
				(map(course => course.id))
			)

		]));

		return pipe(
			(items(ids))
			(retire({ survival, existing }))
			(map(id => id.startsWith(programs.id) ? delta(id, Program, null) : delta(id, Course, null)))
		);

	};

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Identifies the offering a draft states.
 *
 * Names a program by its university, key and academic year and a course by its university, key, academic year and
 * terms, so that both branches of the sink, stating and retracting alike, agree on the offering each draft stands for.
 *
 * @param draft The draft to identify
 *
 * @returns The identifier of the program or course `draft` states, or `undefined` for a blank key or malformed year
 */
export function identify(draft: Draft): undefined | Reference {
	return named(() => draft.kind === "program"
		? getProgramId(draft.university.id, draft.key, { year: draft.year })
		: getCourseId(draft.university.id, draft.key, { year: draft.year, term: draft.term })
	);
}

/**
 * States the offering an attached entry describes.
 *
 * Derives the identifier, the dataset, source and university links and the digest, and labels the offering with its
 * name and comments it with its summary, falling back to its description and to its contents, each clipped to fit. A
 * course is linked to the programs of its university it belongs to, named by the identity rule programs are stated
 * under and leaving out the ones that cannot be named, and to the instructors among `people`; the provider is linked
 * where it was settled, so that no offering links a provider or instructor that failed validation.
 *
 * @param source The identifier of the source listing the offering
 * @param attached The entry to state, along with the provider and people settled for it
 *
 * @returns The state of the program or course `attached` describes, or `undefined` if the draft cannot be identified
 */
export function state(source: Reference, {

	hash,
	draft,
	provider,
	people

}: Attached): undefined | Program | Course {

	const { university } = draft;

	return opt(identify(draft), id => {

		const derived = immutable({

			id,

			university: university.id,

			generated: true,

			label: clipped(draft.name, LabelLength),
			comment: opt(
				[draft.disambiguatingDescription, draft.description, draft.teaches].find(text =>
					text !== undefined && Object.keys(text).length > 0
				),
				text => clipped(text, CommentLength)
			),

			provider: provider?.id,

			source,
			digest: hash

		});

		if ( draft.kind === "program" ) {

			const { kind, university: delivering, key, provider: agency, cues, ...program } = draft;

			return immutable({ ...program, ...derived, dataset: programs.id });

		} else {

			const { kind, university: delivering, key, provider: agency, cues, instructor = [], inProgram = [], ...course } = draft;

			const valid = new Set(people.map(({ id }) => id));

			return immutable({

				...course,
				...derived,

				dataset: courses.id,

				instructor: instructor
					.map(({ familyName, givenName }) => getPersonId(university.id, familyName, givenName))
					.filter(id => valid.has(id)),

				inProgram: inProgram
					.map(({ key, year }) => named(() => getProgramId(university.id, key, { year })))
					.flatMap(multiple)

			});

		}

	});

}

/**
 * States the organisation a source names as the provider of an offering.
 *
 * The organisation is keyed by its home page, falling back to its English name and then to any of its names, so that
 * every source of the university naming it, documents included, states the same organisation.
 *
 * @param university The university naming the organisation
 * @param agency The organisation as the source names it
 *
 * @returns The state of the organisation, ready to be validated
 */
export function organization(university: University, { name, homepage }: Agency): State<typeof Organization> {
	return immutable({

		id: getOrganizationId(university.id, required(homepage ?? name.en ?? Object.values(name)[0])),

		dataset: organizations.id,
		university: university.id,

		label: clipped(name, LabelLength),

		prefLabel: name,
		homepage: opt(homepage, homepage => [homepage])

	});
}

/**
 * States a person a source names as an instructor.
 *
 * @param university The university naming the person
 * @param name The person as the source names them
 *
 * @returns The state of the person, ready to be validated
 */
export function person(university: University, name: Name): State<typeof Person> {
	return immutable({

		...name,

		id: getPersonId(university.id, name.familyName, name.givenName),

		dataset: persons.id,
		university: university.id,

		label: clip(`${name.givenName} ${name.familyName}`, LabelLength)

	});
}


/**
 * Names an offering, absorbing the rejection of a blank key or a malformed year.
 */
function named(identifier: () => Reference): undefined | Reference {
	try {

		return identifier();

	} catch ( error ) {

		if ( error instanceof RangeError ) {

			logger.debug`unnamed offering: ${report(error)}`;

			return undefined;

		} else {

			throw error;

		}

	}
}

function clipped(text: Dictionary, length: number): Dictionary {
	return Object.fromEntries(Object.entries(text).map(([tag, value]) => [tag, clip(value, length)]));
}
