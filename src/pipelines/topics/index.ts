/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { distance } from "@/utilities/ai/vectors";
import { ai, embedding } from "@/utilities/gcp/gemini";

export interface Topic {

	readonly id: string;

	readonly label: string;
	readonly definition: string;

	readonly scheme: string;
	readonly broader: undefined | string;
	readonly lineage: readonly string[];

	readonly embedding: readonly number[];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function index(text: string): Promise<readonly number[]> {
	return embedding(await ai.models.embedContent({
		model: "text-embedding-004", //  see https://ai.google.dev/models
		contents: text,
		config: {
			taskType: "CLASSIFICATION" // see https://ai.google.dev/gemini-api/docs/embeddings#supported-task-types
		}
	}));
}

/**
 * Matches topics against a text query using semantic similarity.
 *
 * <p>Topics are ranked by cosine distance from the query text embedding, with optional filtering
 * and adjustment parameters to refine results.</p>
 *
 * @param text the query text to match against topics
 * @param topics the collection of topics to search
 * @param focus optional topic ID to restrict matches to descendants (topics whose lineage includes this ID)
 * @param limit optional maximum number of matches to return (must be non-negative)
 * @param threshold optional maximum distance threshold; topics with distance exceeding this value are excluded
 *        (must be non-negative)
 * @param tolerance optional relative tolerance from the best match; filters results within
 *        {@code best + max(1-best, 0) * tolerance} of the best match distance (must be non-negative)
 * @param narrowing optional depth adjustment factor; when specified, multiplies distance by {@code narrowing^depth}
 *        where depth is {@code lineage.length - 1}. Values > 1 penalize deeper topics; values < 1 favor them.
 *        (must be non-negative)
 *
 * @return tuples of [topic, score] ordered by increasing distance from the query text, where score is the adjusted
 *         cosine distance; filtered and limited according to parameters
 *
 * @throws RangeError if {@code limit}, {@code threshold}, {@code tolerance}, or {@code narrowing} is negative
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

	const embedding = await index(text);

	const sorted = topics
		.filter(topic => focus === undefined || topic.lineage.includes(focus))
		.map(topic => [topic,
			distance(embedding, topic.embedding)*(narrowing ? Math.pow(narrowing, topic.lineage.length-1) : 1)
		] as const)
		.filter(([, d]) => threshold === undefined || d <= threshold)
		.sort((x, y) => x[1]-y[1]);

	const best = sorted[0]?.[1];

	return sorted
		.filter(([, d]) => tolerance === undefined || d <= best+Math.max(1-best, 0)*tolerance)
		.slice(0, limit);

}
