/*
 * Copyright © 2026 Metreeca srl
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

/**
 * Tree semantic indexing.
 *
 * Provides an {@link Index} over the nodes of a tree, so that a consumer searches a classification scheme by meaning
 * while confining the outcome to a branch of it and weighing nodes near the root against nodes near the leaves.
 *
 * @module
 */

import { assert } from "@metreeca/core";
import { cosine, type Distance, type Embedding, type Index } from "./index.js";


/**
 * A node of a tree.
 *
 * Describes whatever the consumer classifies by, a concept or a category, to an index: the meaning it is matched on
 * and the place it holds in the tree. Lookups answer with its identifier, so whatever else it carries stays with the
 * consumer.
 *
 * @typeParam T The type of the identifiers nodes are named by
 */
export type TreeNode<T> = {

	/**
	 * The identifier the node is named by and lookups answer with.
	 */
	readonly id: T;

	/**
	 * The nodes the node descends from, from the root down to its parent; if undefined, the node stands as a root.
	 */
	readonly lineage?: readonly T[];

	/**
	 * The embedding positioning the meaning of the node, drawn from the embedder lookups are queried with.
	 */
	readonly embedding: Embedding;

}

/**
 * Tree index options.
 *
 * Confine the outcome to a branch of the tree, drop weak and comparatively weak matches, shift the balance between
 * nodes near the root and nodes near the leaves, and cap the size of the outcome. Options are settled as the index is
 * created and hold for every lookup made through it; those left undefined place no constraint of their own.
 *
 * @typeParam T The type of the identifiers nodes are named by
 */
export type TreeIndexOpts<T> = {

	/**
	 * The identifier of the node the index is to be restricted to the descendants of; if undefined, the whole tree is
	 * searched.
	 */
	readonly focus?: T;

	/**
	 * The maximum number of matches a lookup returns, non-negative; if undefined, every match is returned.
	 */
	readonly limit?: number;

	/**
	 * The maximum distance a match is accepted at, non-negative; if undefined, matches are accepted at any distance.
	 */
	readonly threshold?: Distance;

	/**
	 * The relative distance from the best match a match is accepted within, non-negative, as a fraction of the room
	 * left above the best distance; if undefined, matches are accepted however far from the best one.
	 */
	readonly tolerance?: number;

	/**
	 * The factor the distance of a node is scaled by for each step below the root of the tree, non-negative; values
	 * above 1 penalise deep nodes, values below 1 favour them; if undefined, distances are taken as they stand.
	 */
	readonly narrowing?: number;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an index over a tree.
 *
 * Nodes are ranked by the cosine distance between their embedding and the one the index is looked up with, so that a
 * consumer retrieves what a text is about without matching its wording against labels. The tree is read off the
 * lineage of each node, so the index confines itself to a subtree and weighs nodes by their depth.
 *
 * The nodes are read as the index is created and held as they stand, so one added, dropped or re-embedded afterwards
 * calls for an index of its own.
 *
 * @typeParam T The type of the identifiers nodes are named by
 *
 * @param nodes The nodes to index
 * @param options The {@link TreeIndexOpts} bounds every lookup is held to; if undefined, lookups are unbounded
 *
 * @returns An index answering with the nodes of `nodes` closest to the embedding it is looked up with
 *
 * @throws {@link !TypeError TypeError} If `options.limit`, `options.threshold`, `options.tolerance` or
 * `options.narrowing` is negative
 */
export function createTreeIndex<T>(nodes: readonly TreeNode<T>[], {

	focus,
	limit,

	threshold,
	tolerance,
	narrowing

}: TreeIndexOpts<T>={}): Index<T> {

	const $limit = assert(limit ?? Infinity, value => value >= 0, value => `negative limit <${value}>`);

	const $threshold = assert(threshold ?? Infinity, value => value >= 0, value => `negative threshold <${value}>`);
	const $tolerance = assert(tolerance, value => value === undefined || value >= 0, value => `negative tolerance <${value}>`);
	const $narrowing = assert(narrowing ?? 1, value => value >= 0, value => `negative narrowing <${value}>`);


	// the lineage of a node settles both the subtree it sits in and its depth, so the focus is honoured and the
	// narrowing penalty computed as the index is built rather than at every lookup

	const indexed = nodes

		.filter(({ lineage = [] }) => focus === undefined || lineage.includes(focus))

		.map(({ id, embedding, lineage = [] }) => ({
			id,
			embedding,
			narrowing: Math.pow($narrowing, lineage.length)
		}));

	return query => {

		const sorted = indexed

			.map(node => [node.id, cosine(query, node.embedding)*node.narrowing] as [T, Distance])

			.filter(([, distance]) => distance <= $threshold)

			.sort(([, x], [, y]) => x-y);

		// tolerance has no neutral value, as the room it measures closes up once the best match is itself a distant one

		const best = sorted[0]?.[1] ?? 0;
		const bound = $tolerance === undefined ? Infinity : best+Math.max(1-best, 0)*$tolerance;

		return sorted
			.filter(([, distance]) => distance <= bound)
			.slice(0, $limit);

	};

}
