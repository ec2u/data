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

import type { OpenAI } from "openai";
import { describe, expect, it } from "vitest";
import { json } from "./index.js";


describe("json", () => {

	function completion(content: string): OpenAI.ChatCompletion {
		return {
			id: "test",
			object: "chat.completion",
			created: 0,
			model: "test",
			choices: [{
				index: 0,
				finish_reason: "stop",
				logprobs: null,
				message: { role: "assistant", content, refusal: null }
			}]
		};
	}

	it("parses the output text as JSON", async () => {

		expect(json(completion(`{ "label": "text", "count": 1 }`))).toEqual({ label: "text", count: 1 });

	});

	it("drops object members stated as null", async () => {

		expect(json(completion(`{ "label": null, "venue": { "label": "venue", "city": null } }`)))
			.toStrictEqual({ venue: { label: "venue" } });

	});

	it("keeps null array items", async () => {

		expect(json(completion(`{ "labels": [null, "text"] }`))).toStrictEqual({ labels: [null, "text"] });

	});

	it("rejects malformed output text", async () => {

		expect(() => json(completion(`{ "label": `))).toThrow("malformed model response");

	});

});
