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
import { getTopicId, Taxonomy, Topic } from "@ec2u/data-shared/taxonomies/index.js";
import type { State } from "@metreeca/blue/value";
import { opt } from "@metreeca/core";
import { multiple, type Some } from "@metreeca/core/arrays";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Sink, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toSet } from "@metreeca/flow/sinks";
import { filter, fork, map, mix, tee } from "@metreeca/flow/tasks";
import { compress, synopsis } from "@metreeca/llms";
import { validate } from "@metreeca/mime-jsonld";
import { delta, type Delta, lookup, retire, settle, type Tally } from "@metreeca/pipe-store";
import { digest } from "@metreeca/work/core/digest.js";
import { getTopicEmbedding } from "../index.core.js";


const survival = 0.75; // the smallest fraction of the stored topics a document must account for // !!! as option


/**
 * A topic as read from a source, independent of the taxonomy it is stated in.
 *
 * The identifier and the broader topics are slash-separated paths relative to the taxonomy; the sink resolves them and
 * derives the label, the comment, the taxonomy links, the digest and the embedding.
 */
export type Draft = Omit<Topic,
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
 * The feed of drafts is drawn and its topics committed under a single store transaction, so the taxonomy is never half
 * published: a failing write, a refused retraction or a parse dying part way leaves the store exactly as it was and
 * the next run simply starts over. A draft whose digest matches the one recorded with the topic the store already
 * holds is dropped before it is completed, so an unchanged source costs a retrieval and a comparison per draft;
 * under `force` every draft is completed and stated afresh, whatever the store holds, so a topic whose completion
 * changed without its draft changing is brought back in line with the completion rules currently in force.
 *
 * Completions run concurrently, one for every draft left to complete, so a source costs about as long as its slowest
 * draft rather than the sum of them all. The embedding each completion requests is paced by the quota throttle the
 * Gemini client carries, so the run keeps within the published rate however many drafts it opens at once.
 *
 * The taxonomy is stated as it is handed over, alongside the topics and under the same transaction, so a scheme is
 * described wherever its topics are held. Its publisher and licenses are stated with it, so the names they are shown
 * with are held wherever the taxonomy is.
 *
 * Topics are stated as they are drawn. The ones the store holds for the taxonomy and the feed never named are
 * retracted once it has been drawn whole, so nothing is retired on the strength of a partial reading. A feed listing
 * fewer than three quarters of the stored topics states nothing and fails, so a truncated or unreachable source costs
 * a run rather than the taxonomy, while one that renames its topics wholesale is published as it stands.
 *
 * @param taxonomy The taxonomy the topics are attributed to
 * @param taxonomy.id The identifier of the concept scheme the topics belong to
 *
 * @param options The options governing how drafts are stated and the provenance resources the taxonomy references
 * @param options.force Whether every draft is stated afresh, ignoring the digests of stored topics; defaults to `false`
 * @param options.publisher The organisation `taxonomy.publisher` refers to
 * @param options.licenses The licenses `taxonomy.license` refers to; none if omitted
 *
 * @returns A sink drawing a feed of topic drafts and resolving to a tally of what it did
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if the run would leave in place less than three
 * quarters of the stored topics, or if the store rejects a topic as invalid, with nothing committed
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
				(map(topic => topic.digest))
				(toSet())
			);

			return pipe(
				(items(drafts))
				(map(draft => ({ draft, hash: digest(draft) })))
				(filter(async ({ hash }) => !(await digests).has(hash)))
				(fork(0, map(({ draft, hash }) => complete(hash, draft))))
				(validate(Topic))
				(map(topic => delta(topic.id, Topic, topic)))
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

				id: getTopicId(taxonomy, id),

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

				broader: broader.map(path => getTopicId(taxonomy, path)),
				broaderTransitive: broaderTransitive.map(path => getTopicId(taxonomy, path)),

				digest: hash,

				// topics are embedded from their English text, as the search queries they are matched against are
				// written in English by classifiers working from the English translation of the item they classify

				embedding: compress(await getTopicEmbedding(synopsis(
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
				(map(({ id }) => getTopicId(taxonomy, id)))
				(retire({ atomic: true, survival, existing }))
				(map(id => delta(id, Topic, null)))
			);

		};

	}

}
