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
import { tagName } from "./language.js";


describe("tagName()", () => {

	it("should resolve a language name given in English", async () => {
		expect(tagName("German")).toBe("de");
		expect(tagName("Dutch")).toBe("nl");
	});

	it("should resolve a language name given in any language", async () => {
		expect(tagName("tedesco")).toBe("de");
		expect(tagName("Deutsch")).toBe("de");
		expect(tagName("allemand")).toBe("de");
	});

	it("should ignore case", async () => {
		expect(tagName("GERMAN")).toBe("de");
		expect(tagName("german")).toBe("de");
	});

	it("should ignore accents", async () => {
		expect(tagName("Français")).toBe("fr");
		expect(tagName("francais")).toBe("fr");
		expect(tagName("espanol")).toBe("es");
	});

	it("should ignore surrounding whitespace", async () => {
		expect(tagName("  Italian  ")).toBe("it");
	});

	it("should not resolve tags as names", async () => {
		expect(tagName("de")).toBeUndefined();
		expect(tagName("en")).toBeUndefined();
	});

	it("should not resolve unknown names", async () => {
		expect(tagName("")).toBeUndefined();
		expect(tagName("Klingonese")).toBeUndefined();
	});

	it("should not resolve names shared by different languages", async () => {
		expect(tagName("Akan")).toBeUndefined(); // ak and tw
	});

});
