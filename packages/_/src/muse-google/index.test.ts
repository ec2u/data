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

import { createGoogleAI, json, text as output } from "./index.js";
import {
	FinishReason,
	type GenerateContentConfig,
	type GenerateContentParameters,
	GenerateContentResponse,
	type Part,
	Type
} from "@google/genai";
import { afterEach, describe, expect, it, vi } from "vitest";


/**
 * Stands in for the request the SDK would submit to the Gemini API.
 */
const generate = vi.hoisted(() => vi.fn<(params: GenerateContentParameters) => Promise<GenerateContentResponse>>());

vi.mock("@google/genai", async importOriginal => {

	const actual = await importOriginal<typeof import("@google/genai")>();

	return {
		...actual, GoogleGenAI: class extends actual.GoogleGenAI {

			constructor(options: ConstructorParameters<typeof actual.GoogleGenAI>[0]) {
				super(options);
				Object.assign(this.models, { generateContent: generate });
			}

		}
	};

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("createGoogleAI", () => {

	describe("structured output with tools", () => {

		const converter = "gemini-2.5-flash-lite";

		const tools = [{ functionDeclarations: [] }];
		const responseJsonSchema = { type: "object", properties: { label: { type: "string" } } };

		/**
		 * Replaces the SDK request with a stub answering the converter model with JSON and any other model with prose,
		 * and returns the configs of the requests submitted to each model.
		 */
		function stub() {

			generate.mockImplementation(async ({ model }) =>
				generated({ parts: [{ text: model === converter ? `{ "label": "converted" }` : "prose" }] })
			);

			return (model: string): readonly (GenerateContentConfig | undefined)[] => generate.mock.calls
				.map(([params]) => params)
				.filter(params => params.model === model)
				.map(({ config }) => config);

		}

		afterEach(() => {
			generate.mockReset();
		});

		it("submits a JSON Schema to models accepting it alongside tools", async () => {

			const requests = stub();

			const response = await createGoogleAI({ apiKey: "test" }).models.generateContent({
				model: "gemini-3-flash",
				contents: "query",
				config: { tools, responseMimeType: "application/json", responseJsonSchema }
			});

			expect(requests("gemini-3-flash")).toEqual([expect.objectContaining({
				responseMimeType: "application/json",
				responseJsonSchema
			})]);

			expect(requests(converter)).toEqual([]);
			expect(output(response)).toBe("prose");

		});

		it("converts the prose of models rejecting a JSON Schema alongside tools", async () => {

			const requests = stub();

			const response = await createGoogleAI({ apiKey: "test" }).models.generateContent({
				model: "gemini-2.5-flash",
				contents: "query",
				config: { tools, responseMimeType: "application/json", responseJsonSchema }
			});

			expect(requests("gemini-2.5-flash")).toEqual([expect.not.objectContaining({
				responseJsonSchema: expect.anything()
			})]);

			expect(requests(converter)).toEqual([expect.objectContaining({
				responseMimeType: "application/json",
				responseJsonSchema
			})]);

			expect(json(response)).toEqual({ label: "converted" });

		});

		it("converts the prose of models rejecting a legacy schema alongside tools", async () => {

			const requests = stub();

			const responseSchema = { type: Type.OBJECT, properties: { label: { type: Type.STRING } } };

			const response = await createGoogleAI({ apiKey: "test" }).models.generateContent({
				model: "gemini-2.5-flash",
				contents: "query",
				config: { tools, responseMimeType: "application/json", responseSchema }
			});

			expect(requests(converter)).toEqual([expect.objectContaining({ responseSchema })]);
			expect(json(response)).toEqual({ label: "converted" });

		});

		it("hands over the response as it stands if no schema is requested", async () => {

			const requests = stub();

			const response = await createGoogleAI({ apiKey: "test" }).models.generateContent({
				model: "gemini-2.5-flash",
				contents: "query",
				config: { tools }
			});

			expect(requests(converter)).toEqual([]);
			expect(output(response)).toBe("prose");

		});

	});

});

describe("text", () => {

	it("joins the output text of the parts generated for the caller", () => {

		expect(output(generated({ parts: [{ text: " one " }, { text: "skipped", thought: true }, { text: "two" }] })))
			.toBe("one \n\ntwo");

	});

	it("reports a generation carrying no output text, naming the reason it was withheld", () => {

		expect(() => output(generated({ finishReason: FinishReason.RECITATION })))
			.toThrow("empty generation <RECITATION>");

	});

	it("reports a response carrying no candidate", () => {

		expect(() => output(Object.assign(new GenerateContentResponse(), { candidates: [] })))
			.toThrow("empty generation <undefined>");

	});

});

describe("json", () => {

	it("parses the output text as a JSON payload", () => {

		expect(json(generated({ parts: [{ text: `{ "label": "x" }` }] }))).toEqual({ label: "x" });

	});

	it("reports a generation carrying no output text as empty rather than malformed", () => {

		expect(() => json(generated({ finishReason: FinishReason.RECITATION })))
			.toThrow("empty generation <RECITATION>");

	});

	it("reports output text that is not well-formed JSON", () => {

		expect(() => json(generated({ parts: [{ text: `{ "label": ` }] })))
			.toThrow(/^malformed model response/);

	});

});


function generated({ parts, finishReason = FinishReason.STOP }: {

	readonly parts?: readonly Part[]
	readonly finishReason?: FinishReason

}): GenerateContentResponse {

	return Object.assign(new GenerateContentResponse(), {
		candidates: [{ finishReason, content: parts ? { role: "model", parts: [...parts] } : {} }]
	});

}
