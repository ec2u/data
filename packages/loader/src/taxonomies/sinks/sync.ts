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
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { Concept, getConceptId, Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import type { State } from "@grafctory/blue/value";
import { opt } from "@grafctory/core";
import { multiple, type Some } from "@grafctory/core/arrays";
import { clip } from "@grafctory/core/strings";
import { immutable } from "@grafctory/core/values";
import { pipe, type Sink, type Task } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { toSet } from "@grafctory/flow/sinks";
import { filter, fork, map, mix, tee } from "@grafctory/flow/tasks";
import { compress, synopsis } from "@grafctory/llms/vectors";
import { digest } from "@grafctory/mime-json";
import { validate } from "@grafctory/mime-jsonld";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@grafctory/pipe-store";
import { getConceptEmbedding } from "../index.core.js";


const survival = 0.75; // the smallest fraction of the stored concepts a document must account for // !!! as option


/**
 * A concept as read from a source, independent of the taxonomy it is stated in.
 *
 * The identifier and the broader concepts are slash-separated paths relative to the taxonomy, which the sink resolves,
 * deriving the label, the comment, the taxonomy links, the digest and the embedding.
 */
export type Draft = Omit<Concept,
	| "label"
	| "comment"
	| "dataset"
	| "inScheme"
	| "topConceptOf"
	| "digest"
	| "embedding"
>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a sink replacing a taxonomy as a whole.
 *
 * The feed of drafts is drawn and its concepts committed under one store transaction, so the taxonomy is never half
 * published: a failing write, a refused retraction or a parse dying part way leaves the store exactly as it was and
 * the next run simply starts over. A draft whose digest matches the one recorded with the concept the store already
 * holds is dropped before it is completed, so an unchanged source costs a retrieval and a comparison per draft;
 * under `force` every draft is completed and stated afresh, whatever the store holds, so a concept whose completion
 * changed without its draft changing is brought back in line with the completion rules currently in force.
 *
 * Completions run concurrently, one for every draft left to complete, so a source costs about as long as its slowest
 * draft rather than the sum of them all. The embedding each completion requests is paced by the quota throttle the
 * Gemini client carries, so the run keeps within the published rate however many drafts it opens at once.
 *
 * The taxonomy is stated as it is handed over, alongside the concepts and under the same transaction, so a scheme is
 * described wherever its concepts are held. Its publisher and licenses are stated with it, so the names they are shown
 * with are held wherever the taxonomy is.
 *
 * Concepts are stated as they are drawn. The ones the store holds for the taxonomy and the feed never named are
 * retracted once it has been drawn whole, so nothing is retired on the strength of a partial reading. A feed listing
 * fewer than three quarters of the stored concepts states nothing and fails, so a truncated or unreachable source costs
 * a run rather than the taxonomy, while one that renames its concepts wholesale is published as it stands.
 *
 * @param taxonomy The taxonomy the concepts are attributed to
 * @param taxonomy.id The identifier of the concept scheme the concepts belong to
 *
 * @param options The options governing how drafts are stated and the provenance resources the taxonomy references
 * @param options.force Whether every draft is stated afresh, ignoring stored concept digests; defaults to `false`
 * @param options.publisher The organisation `taxonomy.publisher` refers to
 * @param options.licenses The licenses `taxonomy.license` refers to; none if omitted
 *
 * @returns A sink drawing a feed of concept drafts and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored concepts, or if the store rejects a concept as invalid, with nothing committed
 *
 * @throws {@link !Error Error} While the feed is consumed, if any write fails, with nothing committed
 */
export function sync(taxonomy: Taxonomy, {

	force = false,

	publisher,
	licenses

}: {

	readonly force?: boolean

	readonly publisher: State<typeof Organization>
	readonly licenses?: Some<Entity>

}): Sink<Draft, Tally> {

	return drafts => pipe(
		(items(drafts))
		(tee(
			define(),
			insert(),
			remove()
		))
		(settle({ atomic: true }))
	);


	function define(): Task<Draft, Delta> {

		return () => pipe(
			(items([taxonomy]))
			(validate(Taxonomy))
			(map(taxonomy => delta(taxonomy.id, Taxonomy, taxonomy)))
			(mix<Delta, Delta>(
				pipe(
					(items([publisher]))
					(validate(Organization))
					(map(publisher => delta(publisher.id, Organization, publisher)))
				),
				pipe(
					(items(multiple(licenses)))
					(validate(Entity))
					(map(license => delta(license.id, Entity, license)))
				)
			))
		);

	}

	function insert(): Task<Draft, Delta> {

		return drafts => {

			const digests = force ? new Set<string>() : pipe(
				(lookup({

					entry: taxonomy.id,
					shape: Taxonomy,
					model: { resources: { digest: {} } }

				}))
				(map(concept => concept.digest))
				(toSet())
			);

			return pipe(
				(items(drafts))
				(map(draft => ({ draft, hash: digest(draft) })))
				(filter(async ({ hash }) => !(await digests).has(hash)))
				(fork(0, map(({ draft, hash }) => complete(hash, draft))))
				(validate(Concept))
				(map(concept => delta(concept.id, Concept, concept)))
			);

		};


		async function complete(hash: string, {

			id,

			notation,

			prefLabel,
			altLabel,
			hiddenLabel,

			definition,

			broader = [],
			broaderTransitive = [],

			...draft

		}: Draft) {

			return immutable({

				...draft,

				id: getConceptId(taxonomy, id),

				dataset: taxonomy.id,

				label: Object.fromEntries(Object.entries(prefLabel).map(([tag, label]) =>
					[tag, clip(notation === undefined ? label : `${notation} - ${label}`, LabelLength)]
				)),

				comment: opt(definition, definition => Object.fromEntries(Object.entries(definition).map(([tag, text]) =>
					[tag, clip(text, CommentLength)]
				))),

				notation,

				prefLabel,
				altLabel,
				hiddenLabel,
				definition,

				inScheme: taxonomy.id,
				topConceptOf: broader.length === 0 ? taxonomy.id : undefined,

				broader: broader.map(path => getConceptId(taxonomy, path)),
				broaderTransitive: broaderTransitive.map(path => getConceptId(taxonomy, path)),

				digest: hash,

				// concepts are embedded from their English text, as the search queries they are matched against are
				// written in English by classifiers working from the English translation of the item they classify

				embedding: compress(await getConceptEmbedding(synopsis(
					prefLabel.en,
					altLabel?.en ?? [],
					hiddenLabel?.en ?? [],
					definition?.en
				)))

			});

		}

	}

	function remove(): Task<Draft, Delta> {

		return drafts => {

			const existing = lookup({

				entry: taxonomy.id,
				shape: Taxonomy,
				model: { resources: {} }

			});

			return pipe(
				(items(drafts))
				(map(({ id }) => getConceptId(taxonomy, id)))
				(retire({ atomic: true, survival, existing }))
				(map(id => delta(id, Concept, null)))
			);

		};

	}

}
