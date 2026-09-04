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
import { createComboTranslator } from "./combo.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class TranslatorError extends Error {}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("createComboTranslator", () => {

	it("serves the translation produced by the first delegate", async () => {

		const translator = createComboTranslator(text => `<${text}>`, text => `[${text}]`);

		expect(await translator("text", "it", "en")).toBe("<text>");

	});

	it("hands a failed request over to the next delegate", async () => {

		const translator = createComboTranslator(() => { throw new Error("failed"); }, text => `[${text}]`);

		expect(await translator("text", "it", "en")).toBe("[text]");

	});

	it("hands an empty translation over to the next delegate", async () => {

		const translator = createComboTranslator(() => "", text => `[${text}]`);

		expect(await translator("text", "it", "en")).toBe("[text]");

	});

	it("rejects a request no delegate could serve", async () => {

		const translator = createComboTranslator(() => { throw new Error("failed"); });

		await expect(translator("text", "it", "en")).rejects.toThrow(Error);

	});

	it("serves text already written in the target language without reaching a delegate", async () => {

		const delegate = vi.fn((text: string) => `<${text}>`);
		const translator = createComboTranslator(delegate);

		expect(await translator("text", "en", "en-GB")).toBe("text");
		expect(delegate).not.toHaveBeenCalled();

	});

	it("stops at the first delegate serving the request", async () => {

		const fallback = vi.fn((text: string) => `[${text}]`);

		await createComboTranslator(text => `<${text}>`, fallback)("text", "it", "en");

		expect(fallback).not.toHaveBeenCalled();

	});

	it("rejects a request with no delegate at all", async () => {

		await expect(createComboTranslator()("text", "it", "en")).rejects.toThrow(Error);

	});

	it("reports the last delegate failure as the cause", async () => {

		const translator = createComboTranslator(() => { throw new TranslatorError(); });

		await expect(translator("text", "it", "en")).rejects.toMatchObject({

			cause: expect.any(TranslatorError)

		});

	});

	it("releases every delegate as the execution ends", async () => {

		const first = vi.fn(async () => {});
		const second = vi.fn(async () => {});

		await dispose(createComboTranslator(

			Object.assign((text: string) => `<${text}>`, { [Symbol.asyncDispose]: first }),
			Object.assign((text: string) => `[${text}]`, { [Symbol.asyncDispose]: second })

		));

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);

	});

});
