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
import { createCacheTranslator } from "./cache.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class TranslatorError extends Error {}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("createCacheTranslator", () => {

	it("serves the translation produced by the delegate", async () => {

		const translator = createCacheTranslator(text => `<${text}>`);

		expect(await translator("text", "it", "en")).toBe("<text>");

	});

	it("serves a repeated request without reaching the delegate", async () => {

		const delegate = vi.fn((text: string) => `<${text}>`);
		const translator = createCacheTranslator(delegate);

		await translator("text", "it", "en");
		await translator("text", "it", "en");

		expect(delegate).toHaveBeenCalledTimes(1);

	});

	it("distinguishes requests by text and languages", async () => {

		const delegate = vi.fn((text: string) => `<${text}>`);
		const translator = createCacheTranslator(delegate);

		await translator("text", "it", "en");
		await translator("other", "it", "en");
		await translator("text", "fr", "en");
		await translator("text", "it");

		expect(delegate).toHaveBeenCalledTimes(4);

	});

	it("leaves a failed translation free to be retried", async () => {

		const delegate = vi.fn()
			.mockRejectedValueOnce(new TranslatorError())
			.mockResolvedValueOnce("<text>");

		const translator = createCacheTranslator(delegate);

		await expect(translator("text", "it", "en")).rejects.toThrow(TranslatorError);

		expect(await translator("text", "it", "en")).toBe("<text>");

	});

	it("releases the delegate as the execution ends", async () => {

		const release = vi.fn(async () => {});

		const delegate = Object.assign(

			(text: string) => `<${text}>`,

			{ [Symbol.asyncDispose]: release }

		);

		await dispose(createCacheTranslator(delegate));

		expect(release).toHaveBeenCalledTimes(1);

	});

});
