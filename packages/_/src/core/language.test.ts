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
import { tagURL, tagName } from "./language.js";


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

describe("tagURL()", () => {

	it("should read the language from query parameters", async () => {
		expect(tagURL("https://studienhandbuch.jku.at/detail.php?lang=en&klaId=525DPHIPHIS21")).toBe("en");
		expect(tagURL("http://www.dke.uni-linz.ac.at/index.xq?lang=en")).toBe("en");
		expect(tagURL("https://example.org/page?language=de")).toBe("de");
		expect(tagURL("https://example.org/page?hl=fr")).toBe("fr");
		expect(tagURL("https://example.org/page?locale=pt_PT")).toBe("pt");
	});

	it("should read the language from full language tags in query parameters", async () => {
		expect(tagURL("https://example.org/page?lang=zh-Hans")).toBe("zh");
		expect(tagURL("https://example.org/page?lang=es-419")).toBe("es");
	});

	it("should read the language from language names in query parameters", async () => {
		expect(tagURL("https://example.org/page?lang=English")).toBe("en");
	});

	it("should accept parsed URLs", async () => {
		expect(tagURL(new URL("https://example.org/en/page"))).toBe("en");
	});

	it("should read the language from path segments", async () => {
		expect(tagURL("https://www.uc.pt/en/")).toBe("en");
		expect(tagURL("https://www.uc.pt/pt")).toBe("pt");
		expect(tagURL("https://apps.uc.pt/courses/EN/course/2301")).toBe("en");
		expect(tagURL("https://www.utu.fi/fi/opiskelijaksi/opiskelijan%20palvelut")).toBe("fi");
		expect(tagURL("https://example.org/en-gb/about")).toBe("en");
	});

	it("should read the language from file names", async () => {
		expect(tagURL("http://www.ag.jku.at/home_en.htm")).toBe("en");
		expect(tagURL("https://web.unipv.it/wp-content/uploads/2022/04/GEP_defSA-1_eng.pdf")).toBe("en");
		expect(tagURL("https://portale.unipv.it/files/Codice%20Etico%20%E2%80%93%20Versione%20Inglese.pdf")).toBe("en");
	});

	it("should prefer query parameters to path segments", async () => {
		expect(tagURL("https://example.org/de/page?lang=en")).toBe("en");
	});

	it("should prefer the first path segment naming a language", async () => {
		expect(tagURL("https://example.org/fr/it/page")).toBe("fr");
	});

	it("should ignore hosts", async () => {
		expect(tagURL("https://en.example.org/")).toBeUndefined();
		expect(tagURL("https://www.uni-jena.de/")).toBeUndefined();
	});

	it("should ignore the words of hyphenated slugs", async () => {
		expect(tagURL("https://example.org/universite-de-poitiers")).toBeUndefined();
		expect(tagURL("https://www.jku.at/linz-school-of-education/abteilung-fuer-bildungsforschung/")).toBeUndefined();
	});

	it("should ignore segments naming no language", async () => {
		expect(tagURL("https://example.org/xx/page")).toBeUndefined();
		expect(tagURL("https://example.org/and/the/end.pdf")).toBeUndefined();
		expect(tagURL("https://guias.usal.es/node/4945")).toBeUndefined();
		expect(tagURL("https://utuguides.fi/vaitoskirjat")).toBeUndefined();
	});

	it("should ignore path segments with three-letter codes", async () => {
		expect(tagURL("https://www.uc.pt/iii/ceis20")).toBeUndefined(); // not Sichuan Yi
		expect(tagURL("https://www.umu.se/forskning/infrastruktur/mal/")).toBeUndefined(); // not Malayalam
		expect(tagURL("https://example.org/eng/page")).toBeUndefined();
	});

	it("should read any language if no target languages are given", async () => {
		expect(tagURL("https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033202746")).toBe("id");
	});

	it("should read only target languages if given", async () => {
		expect(tagURL("https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033202746", ["en", "fr"])).toBeUndefined();
		expect(tagURL("https://utu.zoom.us/my/kasvatustieteet", ["en", "fi"])).toBeUndefined();
		expect(tagURL("https://example.org/page?lang=de", ["en", "fr"])).toBeUndefined();
		expect(tagURL("https://example.org/Versione%20Inglese.pdf", ["it"])).toBeUndefined();
		expect(tagURL("https://example.org/de/en/page", ["en", "fr"])).toBe("en");
	});

	it("should return undefined for text that is no IRI", async () => {
		expect(tagURL("")).toBeUndefined();
		expect(tagURL("not a url")).toBeUndefined();
		expect(tagURL("mailto:user@example.org")).toBeUndefined();
	});

});
