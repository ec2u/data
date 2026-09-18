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

import { describe, expect, it, vi } from "vitest";
import { memoize } from "./memoize.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class FactoryError extends Error {}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("memoize", () => {

	it("returns the value computed by the factory", async () => {

		const cache = memoize((key: string) => key.toUpperCase());

		expect(cache("alpha")).toBe("ALPHA");

	});

	it("computes a distinct value for each key", async () => {

		const cache = memoize((key: string) => key.length);

		expect(cache("alpha")).toBe(5);
		expect(cache("beta")).toBe(4);

	});

	it("returns the same value on repeated lookups", async () => {

		const cache = memoize((key: string) => ({ key }));

		expect(cache("alpha")).toBe(cache("alpha"));

	});

	it("computes each value only once", async () => {

		const factory = vi.fn((key: string) => key.toUpperCase());
		const cache = memoize(factory);

		cache("alpha");
		cache("alpha");

		expect(factory).toHaveBeenCalledTimes(1);

	});

	it("computes values on demand", async () => {

		const factory = vi.fn((key: string) => key.toUpperCase());

		memoize(factory);

		expect(factory).not.toHaveBeenCalled();

	});

	it("isolates entries of independent caches", async () => {

		const factory = vi.fn((key: string) => key.toUpperCase());

		memoize(factory)("alpha");
		memoize(factory)("alpha");

		expect(factory).toHaveBeenCalledTimes(2);

	});


	describe("with undefined values", () => {

		it("returns undefined values", async () => {

			const cache = memoize((key: string) => key === "alpha" ? undefined : key);

			expect(cache("alpha")).toBeUndefined();

		});

		it("computes undefined values only once", async () => {

			const factory = vi.fn((key: string): string | undefined => undefined);
			const cache = memoize(factory);

			cache("alpha");
			cache("alpha");

			expect(factory).toHaveBeenCalledTimes(1);

		});

		it("distinguishes cached undefined values from unknown keys", async () => {

			const factory = vi.fn((key: string): string | undefined => undefined);
			const cache = memoize(factory);

			cache("alpha");
			cache("beta");

			expect(factory).toHaveBeenCalledTimes(2);

		});

	});


	describe("with composite keys", () => {

		it("matches keys by same-value-zero equality", async () => {

			const factory = vi.fn((key: number) => String(key));
			const cache = memoize(factory);

			cache(NaN);
			cache(NaN);

			expect(factory).toHaveBeenCalledTimes(1);

		});

		it("distinguishes structurally equal object keys", async () => {

			const factory = vi.fn((key: { id: string }) => key.id);
			const cache = memoize(factory);

			cache({ id: "alpha" });
			cache({ id: "alpha" });

			expect(factory).toHaveBeenCalledTimes(2);

		});

	});


	describe("with failing factories", () => {

		it("reports factory errors", async () => {

			const cache = memoize((key: string) => { throw new FactoryError(key); });

			expect(() => cache("alpha")).toThrow(FactoryError);

		});

		it("doesn't cache factory errors", async () => {

			const factory = vi.fn((key: string): string => { throw new FactoryError(key); });
			const cache = memoize(factory);

			expect(() => cache("alpha")).toThrow(FactoryError);
			expect(() => cache("alpha")).toThrow(FactoryError);

			expect(factory).toHaveBeenCalledTimes(2);

		});

	});

});
