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

import { describe, expect, it } from "vitest";
import { digest } from "./digest.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("digest", () => {

	it("computes a lowercase hex-encoded SHA-256 digest", async () => {

		expect(digest(null)).toBe("74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b"); // sha256("null")

	});

	it("digests scalars through their JSON serialisation", async () => {

		expect(digest("alpha")).toBe("902cf2b465fb076229183b408aad4014266eb9eb72d448754227adc1eeac49b9"); // sha256("\"alpha\"")

	});

	it("computes the same digest for equal values", async () => {

		expect(digest({ alpha: [1, "two", true] })).toBe(digest({ alpha: [1, "two", true] }));

	});

	it("computes distinct digests for distinct values", async () => {

		expect(digest("alpha")).not.toBe(digest("beta"));

	});

	it("distinguishes values of different types", async () => {

		expect(digest(1)).not.toBe(digest("1"));
		expect(digest(true)).not.toBe(digest("true"));
		expect(digest(null)).not.toBe(digest("null"));

	});


	describe("with objects", () => {

		it("ignores entry order", async () => {

			expect(digest({ alpha: 1, beta: 2 })).toBe(digest({ beta: 2, alpha: 1 }));

		});

		it("ignores nested entry order", async () => {

			expect(digest({ outer: { alpha: 1, beta: 2 } })).toBe(digest({ outer: { beta: 2, alpha: 1 } }));

		});

		it("ignores entry order within arrays", async () => {

			expect(digest([{ alpha: 1, beta: 2 }])).toBe(digest([{ beta: 2, alpha: 1 }]));

		});

		it("distinguishes entry names", async () => {

			expect(digest({ alpha: 1 })).not.toBe(digest({ beta: 1 }));

		});

		it("distinguishes entry values", async () => {

			expect(digest({ alpha: 1 })).not.toBe(digest({ alpha: 2 }));

		});

		it("distinguishes nesting", async () => {

			expect(digest({ alpha: { beta: 1 } })).not.toBe(digest({ alpha: 1, beta: 1 }));

		});

	});


	describe("with arrays", () => {

		it("preserves item order", async () => {

			expect(digest([1, 2])).not.toBe(digest([2, 1]));

		});

		it("distinguishes a singleton array from its item", async () => {

			expect(digest([1])).not.toBe(digest(1));

		});

	});


	describe("with values JSON doesn't record", () => {

		it("digests non-finite numbers as null", async () => {

			expect(digest(NaN)).toBe(digest(null));
			expect(digest(Infinity)).toBe(digest(null));

		});

		it("digests negative zero as zero", async () => {

			expect(digest(-0)).toBe(digest(0));

		});

	});

});
