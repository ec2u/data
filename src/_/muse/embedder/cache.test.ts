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
import { dispose } from "../_disposal.js";
import { createCacheEmbedder } from "./cache.js";
import type { Embedding } from "./index.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class EmbedderError extends Error {}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("createCacheEmbedder", () => {

	it("serves the embedding computed by the delegate", async () => {

		const embedder = createCacheEmbedder(text => [text.length]);

		expect(await embedder("text")).toEqual([4]);

	});

	it("serves a repeated request without reaching the delegate", async () => {

		const delegate = vi.fn((text: string) => [text.length]);
		const embedder = createCacheEmbedder(delegate);

		await embedder("text");
		await embedder("text");

		expect(delegate).toHaveBeenCalledTimes(1);

	});

	it("computes a distinct embedding for each text", async () => {

		const delegate = vi.fn((text: string) => [text.length]);
		const embedder = createCacheEmbedder(delegate);

		await embedder("text");
		await embedder("other");

		expect(delegate).toHaveBeenCalledTimes(2);

	});

	it("rejects blank text without reaching the delegate", async () => {

		const delegate = vi.fn((text: string) => [text.length]);
		const embedder = createCacheEmbedder(delegate);

		expect(() => embedder("")).toThrow(RangeError);
		expect(() => embedder("  \n ")).toThrow(RangeError);

		expect(delegate).not.toHaveBeenCalled();

	});

	it("leaves a failed embedding free to be retried", async () => {

		const delegate = vi.fn()
			.mockRejectedValueOnce(new EmbedderError())
			.mockResolvedValueOnce([4]);

		const embedder = createCacheEmbedder(delegate);

		await expect(embedder("text")).rejects.toThrow(EmbedderError);

		expect(await embedder("text")).toEqual([4]);

	});

	it("releases the delegate as the execution ends", async () => {

		const release = vi.fn(async () => {});

		const delegate = Object.assign(

			(text: string): Embedding => [text.length],

			{ [Symbol.asyncDispose]: release }

		);

		await dispose(createCacheEmbedder(delegate));

		expect(release).toHaveBeenCalledTimes(1);

	});

});
