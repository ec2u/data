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

import { createGoogleEmbedder } from "@/_/muse-google/_embedder.js";
import { cosine } from "@/_/muse/embedder/index.js";

export type Topic = {

	readonly id: string;

	readonly label: string;
	readonly definition: string;

	readonly scheme: string;
	readonly broader: undefined | string;
	readonly lineage: readonly string[];

	readonly embedding: readonly number[];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Matches topics against a text query by semantic similarity.
 *
 * Topics are ranked by the cosine distance between their embedding and the embedding of the query, so that a caller
 * retrieves the topics a text is about without matching its wording against labels. The optional bounds narrow the
 * outcome to the topics worth acting on: `focus` restricts the search to a branch of the taxonomy, `threshold` and
 * `tolerance` drop weak and comparatively weak matches, `narrowing` shifts the balance between general and specific
 * topics, and `limit` caps the size of the outcome.
 *
 * @param text The query text to match topics against
 *
 * @param options The matching bounds
 * @param options.topics The topics to search
 * @param options.focus The identifier of the topic matches are to be restricted to the descendants of; if undefined,
 * the whole of `topics` is searched
 * @param options.limit The maximum number of matches to return, non-negative; if undefined, every match is returned
 * @param options.threshold The maximum distance a match is accepted at, non-negative; if undefined, matches are
 * accepted at any distance
 * @param options.tolerance The relative distance from the best match a match is accepted within, non-negative, as a
 * fraction of the room left above the best distance; if undefined, matches are accepted however far from the best one
 * @param options.narrowing The factor the distance of a topic is scaled by for each step below the root of its
 * lineage, non-negative; values above 1 penalise specific topics, values below 1 favour them; if undefined, distances
 * are taken as they stand
 *
 * @returns An immutable list of `[topic, distance]` pairs ordered by increasing adjusted distance from `text`, where
 * `distance` accounts for `narrowing`, limited to the topics accepted by the given bounds
 *
 * @throws {@link !RangeError RangeError} If `text` is blank, or if `limit`, `threshold`, `tolerance` or `narrowing` is
 * negative
 *
 * @throws {@link !Error Error} If no execution is running, as the embedding provider is resolved from the enclosing
 * one, or whatever that provider reports while embedding `text`
 */
export async function match(text: string, {

	topics,

	focus,
	limit,

	threshold,
	tolerance,
	narrowing

}: {

	topics: readonly Topic[]

	focus?: string
	limit?: number

	threshold?: number
	tolerance?: number
	narrowing?: number

}): Promise<readonly (readonly [Topic, number])[]> {

	if ( limit !== undefined && limit < 0 ) {
		throw new RangeError(`negative limit <${limit}>`);
	}

	if ( threshold !== undefined && threshold < 0 ) {
		throw new RangeError(`negative threshold <${threshold}>`);
	}

	if ( tolerance !== undefined && tolerance < 0 ) {
		throw new RangeError(`negative tolerance <${tolerance}>`);
	}

	if ( narrowing !== undefined && narrowing < 0 ) {
		throw new RangeError(`negative narrowing <${narrowing}>`);
	}

	// queries are embedded by the same source topic embeddings were, as cosine distances compare only alike embeddings

	const embedding = await createGoogleEmbedder()(text);

	const sorted = topics
		.filter(topic => focus === undefined || topic.lineage.includes(focus))
		.map(topic => [topic,
			cosine(embedding, topic.embedding)*(narrowing ? Math.pow(narrowing, topic.lineage.length-1) : 1)
		] as const)
		.filter(([, d]) => threshold === undefined || d <= threshold)
		.sort((x, y) => x[1]-y[1]);

	const best = sorted[0]?.[1];

	return sorted
		.filter(([, d]) => tolerance === undefined || d <= best+Math.max(1-best, 0)*tolerance)
		.slice(0, limit);

}
