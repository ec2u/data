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

import { CommentLength, Entity, LabelLength } from "@ec2u/data-shared";
import { Document, documents, Documents, getDocumentId } from "@ec2u/data-shared/documents/index.js";
import { getOrganizationId, Organization, organizations } from "@ec2u/data-shared/organizations/index.js";
import { getPersonId, Person, persons } from "@ec2u/data-shared/persons/index.js";
import type { University } from "@ec2u/data-shared/universities/index.core.js";
import type { State } from "@metreeca/blue/value";
import { opt } from "@metreeca/core";
import { multiple, required } from "@metreeca/core/arrays";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray, toSet } from "@metreeca/flow/sinks";
import { distinct, filter, flat, fork, map, tee, trim } from "@metreeca/flow/tasks";
import { validate } from "@metreeca/mime-jsonld";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@metreeca/pipe-store";
import { digest } from "@metreeca/work/core/digest.js";
import { classify, type Classified } from "../tasks/classify.js";
import { translate } from "../tasks/translate.js";


const analysis = 10; // the number of drafts translated and classified at the same time by the model // !!! as option

const survival = 0.75; // the smallest fraction of the stored documents a sheet must account for // !!! as option


/**
 * A document as read from a source, independent of the university listing it.
 *
 * The identifier is the key the source lists the document under, and so are the identifiers of related documents;
 * people, publisher and license are stated as the source names them. The sink resolves them and derives the label,
 * the comment, the dataset and university links, the digest and the classification.
 */
export type Draft = Omit<Document,
	| "label"
	| "comment"
	| "dataset"
	| "university"
	| "generated"
	| "creator"
	| "contributor"
	| "publisher"
	| "license"
	| "type"
	| "subject"
	| "audience"
	| "digest"
> & {

	readonly creator?: Name
	readonly contributor?: readonly Name[]
	readonly publisher?: Agency
	readonly license?: string

	/**
	 * The document type and audience the source states in its own words, as cues for the classification.
	 */
	readonly cues?: {
		readonly type?: string
		readonly audience?: string
	}

}

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

	readonly name: { readonly [tag: string]: string }
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
 * A classified entry along with the valid states of the people, publisher and license it names.
 */
type Attached = Classified & {

	readonly people: readonly State<typeof Person>[]
	readonly publisher?: State<typeof Organization>
	readonly license?: State<typeof Entity>

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink replacing the documents listed by a university as a whole.
 *
 * The feed of drafts is drawn and its documents committed under a single store transaction, so a listing is never half
 * published: a failing write, a refused retraction or a parse dying part way leaves the store exactly as it was and
 * the next run simply starts over. A draft whose digest matches the one recorded with the document the store already
 * holds is dropped before it is completed, so an unchanged sheet costs a retrieval and a comparison per row; under
 * `force` every draft is completed and stated afresh, whatever the store holds.
 *
 * Completing a draft translates its title and description to English where the source states them only in the local
 * language, and tags the document with its types and audience from the EC2U document and stakeholder taxonomies.
 * A draft the model fails on is dropped and records no digest, so it is completed again on the next run, while the
 * document the store holds for it, if any, is left in place. The people, publisher and license a document names are
 * stated alongside it, so the names they are shown with are held wherever the document is; they are never retracted
 * along with it, as other resources may name them as well. One whose state fails validation is logged and left out,
 * and the document is stated without linking it, so no document links a resource the store doesn't hold.
 *
 * Documents are stated as they are drawn. The ones the store holds for the university and the feed never named are
 * retracted once it has been drawn whole, so nothing is retired on the strength of a partial reading. A feed listing
 * fewer than three quarters of the stored documents states nothing and fails, so a truncated or unreachable sheet costs
 * a run rather than the listing, while one that rekeys its documents wholesale is published as it stands.
 *
 * @param university The university the documents are attributed to
 *
 * @param options The options governing how drafts are stated
 * @param options.force Whether every draft is stated afresh, ignoring the digests of stored documents; defaults to
 * `false`
 *
 * @returns A sink drawing a feed of document drafts and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored documents, or if the store rejects a document as invalid, with nothing committed
 *
 * @throws {@link !Error Error} While the feed is consumed, if any write fails, with nothing committed
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
		(settle({ atomic: true }))
	);


	function insert(): Task<Draft, Delta> {

		return drafts => {

			const digests = force ? new Set<string>() : pipe(
				(lookup({

					entry: documents.id,
					shape: Documents,

					model: { resources: { digest: {}, "?university": [university.id] } } // !!! DSL

				}))
				(map(document => document.digest))
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
				(map(attach))
				(tee(
					define(),
					people(),
					publishers(),
					licenses()
				))
			);

		};


		/**
		 * Settles the people, publisher and license a draft names, leaving out the ones that fail validation, so the
		 * document links only resources that are stated alongside it in the same transaction, never dangling ones.
		 */
		async function attach(classified: Classified): Promise<Attached> {

			const { draft: { creator, contributor = [], publisher, license } } = classified;

			const [people, publishers, licenses] = await Promise.all([

				pipe(
					(items([creator, ...contributor]))
					(trim())
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
				),

				pipe(
					(items([publisher]))
					(trim())
					(map(publisher => immutable({

						id: organization(publisher),

						dataset: organizations.id,
						university: university.id,

						label: Object.fromEntries(Object.entries(publisher.name).map(([tag, label]) =>
							[tag, clip(label, LabelLength)]
						)),

						prefLabel: publisher.name,
						homepage: opt(publisher.homepage, homepage => [homepage])

					})))
					(validate(Organization))
					(toArray())
				),

				pipe(
					(items([license]))
					(trim())
					(map(license => immutable({

						id: license,
						label: clip(license, LabelLength)

					})))
					(validate(Entity))
					(toArray())
				)

			]);

			return immutable({ ...classified, people, publisher: publishers[0], license: licenses[0] });

		}

		function define(): Task<Attached, Delta> {

			return attached => pipe(
				(items(attached))
				(map(complete))
				(validate(Document))
				(map(document => delta(document.id, Document, document)))
			);


			function complete({

				hash,

				draft: {

					id,

					title,
					description,

					creator,
					contributor = [],
					publisher,
					license,

					relation = [],

					cues,

					...draft

				},

				type,
				audience,

				people,
				publisher: stated,
				license: granted

			}: Attached) {

				const valid = new Set(people.map(({ id }) => id));

				const linked = (name: Name) => opt(person(name), id => valid.has(id) ? id : undefined);

				return immutable({

					...draft,

					id: getDocumentId(university.id, id),

					dataset: documents.id,
					university: university.id,

					generated: true,

					label: Object.fromEntries(Object.entries(title).map(([tag, label]) =>
						[tag, clip(label, LabelLength)]
					)),

					comment: opt(description, description => Object.fromEntries(Object.entries(description).map(([tag, text]) =>
						[tag, clip(text, CommentLength)]
					))),

					title,
					description,

					creator: opt(creator, linked),
					contributor: contributor.map(linked).flatMap(multiple),
					publisher: stated?.id,

					license: granted?.id,

					type,
					audience,

					relation: relation.map(key => getDocumentId(university.id, key)),

					digest: hash

				});

			}

		}

		function people(): Task<Attached, Delta> {
			return attached => pipe(
				(items(attached))
				(flat(map(({ people }) => people)))
				(distinct(person => person.id))
				(map(person => delta(person.id, Person, person)))
			);
		}

		function publishers(): Task<Attached, Delta> {
			return attached => pipe(
				(items(attached))
				(map(({ publisher }) => publisher))
				(trim())
				(distinct(organization => organization.id))
				(map(organization => delta(organization.id, Organization, organization)))
			);
		}

		function licenses(): Task<Attached, Delta> {
			return attached => pipe(
				(items(attached))
				(map(({ license }) => license))
				(trim())
				(distinct(license => license.id))
				(map(license => delta(license.id, Entity, license)))
			);
		}

	}

	function remove(): Task<Draft, Delta> {

		return drafts => {

			const existing = pipe(
				(lookup({

					entry: documents.id,
					shape: Documents,

					model: { resources: { id: {}, "?university": [university.id] } } // !!! DSL

				}))
				(map(document => document.id))
			);

			return pipe(
				(items(drafts))
				(map(({ id }) => getDocumentId(university.id, id)))
				(retire({ atomic: true, survival, existing }))
				(map(id => delta(id, Document, null)))
			);

		};

	}


	function person({ familyName, givenName }: Name) {
		return getPersonId(university.id, familyName, givenName);
	}

	function organization({ name, homepage }: Agency) {
		return getOrganizationId(university.id, required(homepage ?? name.en ?? Object.values(name)[0]));
	}

}
