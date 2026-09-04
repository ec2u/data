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
import { createTranslator, translatable } from "./index.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("createTranslator", () => {

	it("rejects a job binding no concrete translator", async () => {

		expect(() => createTranslator()).toThrow(Error);

	});

});


describe("translatable", () => {

	it("accepts text to be translated into another language", () => {

		expect(translatable("text", "it", "en")).toBe(true);

	});

	it("accepts text of an undetermined source language", () => {

		expect(translatable("text", "it")).toBe(true);

	});

	it("rejects blank text", () => {

		expect(translatable("", "it", "en")).toBe(false);
		expect(translatable("  \n ", "it", "en")).toBe(false);
		expect(translatable("", "it")).toBe(false);

	});

	it("rejects text already written in the target language", () => {

		expect(translatable("text", "en", "en")).toBe(false);
		expect(translatable("text", "EN", "en")).toBe(false);

	});

	it("rejects text written in a variant of the target language", () => {

		expect(translatable("text", "en", "en-GB")).toBe(false);
		expect(translatable("text", "en-GB", "en")).toBe(false);

	});

	it("accepts text written in a language sharing a prefix with the target language", () => {

		expect(translatable("text", "en-GB", "en-US")).toBe(true);

	});

});
