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
import { compress, cosine, decompress } from "./index.js";


describe("distance", () => {

	describe("cosine", () => {

		it("reports identical directions as 0", () => {

			expect(cosine([1, 0], [1, 0])).toBeCloseTo(0);
			expect(cosine([1, 0], [0.5, 0])).toBeCloseTo(0);

		});

		it("reports orthogonal directions as 1", () => {

			expect(cosine([1, 0], [0, 1])).toBeCloseTo(1);

		});

		it("reports opposite directions as 2", () => {

			expect(cosine([1, 0], [-1, 0])).toBeCloseTo(2);

		});

		it("rejects embeddings of mismatched length", () => {

			expect(() => cosine([1, 0], [1, 0, 0])).toThrow(RangeError);

		});

		it("rejects zero-norm embeddings", () => {

			expect(() => cosine([0, 0], [1, 0])).toThrow(RangeError);
			expect(() => cosine([1, 0], [0, 0])).toThrow(RangeError);
			expect(() => cosine([], [])).toThrow(RangeError);

		});

		it("rejects non-finite components", () => {

			expect(() => cosine([NaN, 0], [1, 0])).toThrow(RangeError);
			expect(() => cosine([1, 0], [Infinity, 0])).toThrow(RangeError);

		});

	});

});

describe("compress", () => {

	it("restores components within the quantisation step", () => {

		const embedding = [-1, -0.5, 0, 0.25, 1];

		decompress(compress(embedding)).forEach((component, index) => {
			expect(component).toBeCloseTo(embedding[index], 4);
		});

	});

	it("restores the number of components", () => {

		expect(decompress(compress([0.1, 0.2, 0.3]))).toHaveLength(3);

	});

	it("rejects components outside the [-1, 1] range", () => {

		expect(() => compress([2, 0])).toThrow(RangeError);
		expect(() => compress([0, -2])).toThrow(RangeError);

	});

	it("rejects non-finite components", () => {

		expect(() => compress([NaN, 0])).toThrow(RangeError);
		expect(() => compress([0, Infinity])).toThrow(RangeError);

	});

	it("rejects truncated compressed forms", async () => {

		const truncated = Buffer.from([1, 2, 3]).toString("base64"); // an odd byte count can't spell whole components

		expect(() => decompress(truncated)).toThrow(RangeError);

	});

});
