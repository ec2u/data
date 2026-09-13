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

import type { Optional } from "@metreeca/core";
import { describe, expectTypeOf, it } from "vitest";
import type { Embedding, Match } from "./index.js";
import { createTreeIndex } from "./tree.js";


describe("createTreeIndex", () => {

	const query: Embedding = [1, 0];

	const index = createTreeIndex([{ id: "near", embedding: [1, 0] }]);


	describe("limit", () => {

		it("answers with a single match where no limit is stated", async () => {

			expectTypeOf(index(query)).toEqualTypeOf<Optional<Match<string>>>();

		});

		it("answers with a list of matches under a limit of 1", async () => {

			expectTypeOf(index(query, 1)).toEqualTypeOf<readonly Match<string>[]>();

		});

		it("answers with a list of matches under a limit above 1", async () => {

			expectTypeOf(index(query, 2)).toEqualTypeOf<readonly Match<string>[]>();

		});

		it("answers with a list of matches under a limit settled at run time", async () => {

			const limit: number = 2;

			expectTypeOf(index(query, limit)).toEqualTypeOf<readonly Match<string>[]>();

		});

	});

});
