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

import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { bind, executor } from "@metreeca/gear";
import { describe, expect, it, vi } from "vitest";
import { createTranslator, type Translator } from "./index.js";
import { translate } from "./translate.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("translate", () => {

	const stub: Translator = (text, target, source) => `<${text}|${target}|${source ?? "?"}>`;

	it("serves the translations produced by the translator", async () => {

		expect(await pipe(
			(items(["uno", "due"]))
			(translate({ target: "en", source: "it", using: stub }))
			(toArray())
		)).toEqual(["<uno|en|it>", "<due|en|it>"]);

	});

	it("serves text of an undetermined source language", async () => {

		expect(await pipe(
			(items("uno"))
			(translate({ target: "en", using: stub }))
			(toArray())
		)).toEqual(["<uno|en|?>"]);

	});

	it("serves the translations produced by the bound provider", async () => {

		const delegate = vi.fn(stub);

		// asserted inside the execution: releasing a disposable service restores the mock, clearing its call records

		await executor(bind(createTranslator, () => delegate))(async () => {

			expect(await pipe(
				(items("uno"))
				(translate({ target: "en", source: "it" }))
				(toArray())
			)).toEqual(["<uno|en|it>"]);

			expect(delegate).toHaveBeenCalledWith("uno", "en", "it");

		});

	});

	it("settles the provider as the task is created", async () => {

		const delegate = vi.fn(stub);

		const task = await executor(bind(createTranslator, () => delegate))(async () =>
			translate({ target: "en", source: "it" })
		);

		expect(await pipe(
			(items("uno"))
			(task)
			(toArray())
		)).toEqual(["<uno|en|it>"]);

	});

	it("rejects a task created with no provider at all", async () => {

		expect(() => translate({ target: "en", source: "it" })).toThrow(Error);

	});


	describe("guard", () => {

		it("serves blank text as it is", async () => {

			const delegate = vi.fn(stub);

			expect(await pipe(
				(items(["", "  \n "]))
				(translate({ target: "en", source: "it", using: delegate }))
				(toArray())
			)).toEqual(["", "  \n "]);

			expect(delegate).not.toHaveBeenCalled();

		});

		it("serves text already written in the target language as it is", async () => {

			const delegate = vi.fn(stub);

			expect(await pipe(
				(items("text"))
				(translate({ target: "EN", source: "en", using: delegate }))
				(toArray())
			)).toEqual(["text"]);

			expect(delegate).not.toHaveBeenCalled();

		});

		it("serves text written in a variant of the target language as it is", async () => {

			expect(await pipe(
				(items("text"))
				(translate({ target: "en", source: "en-GB", using: stub }))
				(toArray())
			)).toEqual(["text"]);

		});

		it("hands over text written in a language the target language is a variant of", async () => {

			expect(await pipe(
				(items("text"))
				(translate({ target: "en-GB", source: "en", using: stub }))
				(toArray())
			)).toEqual(["<text|en-GB|en>"]);

		});

		it("reports malformed language tags", async () => {

			await expect(pipe(
				(items("text"))
				(translate({ target: "!", source: "en", using: stub }))
				(toArray())
			)).rejects.toThrow(TypeError);

		});

	});

});
