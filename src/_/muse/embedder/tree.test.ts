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

import { describe, expect, it } from "vitest";
import type { Embedding } from "./index.js";
import { createTreeIndex, type TreeNode } from "./tree.js";


describe("createTreeIndex", () => {

	const query: Embedding = [1, 0]; // distances are read against this direction

	const near: TreeNode<string> = { id: "near", embedding: [1, 0] }; // distance 0
	const side: TreeNode<string> = { id: "side", embedding: [0, 1] }; // distance 1
	const away: TreeNode<string> = { id: "away", embedding: [-1, 0] }; // distance 2

	function ids(matches: readonly (readonly [string, number])[]): readonly string[] {
		return matches.map(([id]) => id);
	}


	describe("ranking", () => {

		it("answers with the closest nodes first", async () => {

			const index = createTreeIndex([away, near, side]);

			expect(ids(index(query))).toEqual(["near", "side", "away"]);

		});

		it("answers with the distance each node is ranked by", async () => {

			const index = createTreeIndex([near, side, away]);

			expect(index(query).map(([, distance]) => distance)).toEqual([0, 1, 2]);

		});

		it("answers with nothing where no node is indexed", async () => {

			expect(createTreeIndex<string>([])(query)).toEqual([]);

		});

		it("holds the nodes as they stand when the index is created", async () => {

			const nodes: TreeNode<string>[] = [near];
			const index = createTreeIndex(nodes);

			nodes.push(side);

			expect(ids(index(query))).toEqual(["near"]);

		});

		it("rejects a query the indexed embeddings are not comparable to", async () => {

			const index = createTreeIndex([near]);

			expect(() => index([1, 0, 0])).toThrow(RangeError);

		});

	});


	describe("focus", () => {

		const root: TreeNode<string> = { id: "root", embedding: [1, 0] };
		const branch: TreeNode<string> = { id: "branch", lineage: ["root"], embedding: [1, 0] };
		const leaf: TreeNode<string> = { id: "leaf", lineage: ["root", "branch"], embedding: [1, 0] };
		const other: TreeNode<string> = { id: "other", lineage: ["root"], embedding: [1, 0] };

		it("confines the index to the descendants of the focus", async () => {

			const index = createTreeIndex([root, branch, leaf, other], { focus: "branch" });

			expect(ids(index(query))).toEqual(["leaf"]);

		});

		it("leaves out the focus itself", async () => {

			const index = createTreeIndex([root, branch, leaf], { focus: "root" });

			expect(ids(index(query))).toEqual(["branch", "leaf"]);

		});

		it("searches the whole of the nodes where no focus is stated", async () => {

			const index = createTreeIndex([root, branch, leaf, other]);

			expect(ids(index(query))).toHaveLength(4);

		});

	});


	describe("limit", () => {

		it("caps the size of the outcome", async () => {

			const index = createTreeIndex([near, side, away], { limit: 2 });

			expect(ids(index(query))).toEqual(["near", "side"]);

		});

		it("answers with nothing under a limit of 0", async () => {

			expect(createTreeIndex([near, side], { limit: 0 })(query)).toEqual([]);

		});

		it("rejects a negative limit", async () => {

			expect(() => createTreeIndex([near], { limit: -1 })).toThrow(TypeError);

		});

	});


	describe("threshold", () => {

		it("drops the nodes standing beyond the threshold", async () => {

			const index = createTreeIndex([near, side, away], { threshold: 1 });

			expect(ids(index(query))).toEqual(["near", "side"]);

		});

		it("rejects a negative threshold", async () => {

			expect(() => createTreeIndex([near], { threshold: -1 })).toThrow(TypeError);

		});

	});


	describe("tolerance", () => {

		it("drops the nodes standing comparatively far from the best match", async () => {

			const index = createTreeIndex([near, side, away], { tolerance: 0.5 });

			expect(ids(index(query))).toEqual(["near"]); // the room above the best match is 1, so the bound is 0.5

		});

		it("accepts every match however far from the best one where no tolerance is stated", async () => {

			const index = createTreeIndex([near, side, away]);

			expect(ids(index(query))).toHaveLength(3);

		});

		it("rejects a negative tolerance", async () => {

			expect(() => createTreeIndex([near], { tolerance: -1 })).toThrow(TypeError);

		});

	});


	describe("narrowing", () => {

		const nearer: Embedding = [0.6, 0.8]; // distance 0.4
		const farther: Embedding = [0.5, Math.sqrt(3)/2]; // distance 0.5

		const shallow: TreeNode<string> = { id: "shallow", lineage: ["root"], embedding: nearer };
		const deep: TreeNode<string> = { id: "deep", lineage: ["root", "shallow"], embedding: farther };

		it("takes distances as they stand where no narrowing is stated", async () => {

			const index = createTreeIndex([shallow, deep]);

			expect(ids(index(query))).toEqual(["shallow", "deep"]);

		});

		it("favours deep nodes below 1", async () => {

			const index = createTreeIndex([shallow, deep], { narrowing: 0.5 });

			expect(ids(index(query))).toEqual(["deep", "shallow"]);

		});

		it("penalises deep nodes above 1", async () => { // the deep node stands closer, and is overtaken all the same

			const index = createTreeIndex([

				{ id: "deep", lineage: ["root", "shallow"], embedding: nearer },
				{ id: "shallow", lineage: ["root"], embedding: farther }

			], {

				narrowing: 2

			});

			expect(ids(index(query))).toEqual(["shallow", "deep"]);

		});

		it("takes a node stating no lineage as a root", async () => {

			const index = createTreeIndex([side], { narrowing: 0 }); // a root is scaled by narrowing^0

			expect(index(query).map(([, distance]) => distance)).toEqual([1]);

		});

		it("rejects a negative narrowing", async () => {

			expect(() => createTreeIndex([near], { narrowing: -1 })).toThrow(TypeError);

		});

	});

});
