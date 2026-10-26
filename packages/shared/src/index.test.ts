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
import { english } from "./index.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("english", () => {

	it("reads a plain string as stated", () => {

		expect(english("Università di Pavia")).toBe("Università di Pavia");

	});

	it("reads the English text of a localised value", () => {

		expect(english({ it: "Evento di prova", en: "Test Event" })).toBe("Test Event");

	});

	it("falls back to the text of another language where none is stated in English", () => {

		expect(english({ it: "Evento di prova" })).toBe("Evento di prova");

	});

	it("reads a localised value stating no text at all as empty", () => {

		expect(english({})).toBe("");

	});

});
