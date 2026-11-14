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
import { inferTag, identifyTag } from "./language.js";


describe("identifyTag()", () => {

	it("should resolve a language name given in English", async () => {
		expect(identifyTag("German")).toBe("de");
		expect(identifyTag("Dutch")).toBe("nl");
	});

	it("should resolve a language name given in any language", async () => {
		expect(identifyTag("tedesco")).toBe("de");
		expect(identifyTag("Deutsch")).toBe("de");
		expect(identifyTag("allemand")).toBe("de");
	});

	it("should ignore case", async () => {
		expect(identifyTag("GERMAN")).toBe("de");
		expect(identifyTag("german")).toBe("de");
	});

	it("should ignore accents", async () => {
		expect(identifyTag("Français")).toBe("fr");
		expect(identifyTag("francais")).toBe("fr");
		expect(identifyTag("espanol")).toBe("es");
	});

	it("should ignore surrounding whitespace", async () => {
		expect(identifyTag("  Italian  ")).toBe("it");
	});

	it("should not resolve tags as names", async () => {
		expect(identifyTag("de")).toBeUndefined();
		expect(identifyTag("en")).toBeUndefined();
	});

	it("should not resolve unknown names", async () => {
		expect(identifyTag("")).toBeUndefined();
		expect(identifyTag("Klingonese")).toBeUndefined();
	});

	it("should not resolve names shared by different languages", async () => {
		expect(identifyTag("Akan")).toBeUndefined(); // ak and tw
	});

});

describe("inferTag()", () => {

	it("should read the language from query parameters", async () => {
		expect(inferTag("https://studienhandbuch.jku.at/detail.php?lang=en&klaId=525DPHIPHIS21")).toBe("en");
		expect(inferTag("http://www.dke.uni-linz.ac.at/index.xq?lang=en")).toBe("en");
		expect(inferTag("https://example.org/page?language=de")).toBe("de");
		expect(inferTag("https://example.org/page?hl=fr")).toBe("fr");
		expect(inferTag("https://example.org/page?locale=pt_PT")).toBe("pt");
	});

	it("should read the language from full language tags in query parameters", async () => {
		expect(inferTag("https://example.org/page?lang=zh-Hans")).toBe("zh");
		expect(inferTag("https://example.org/page?lang=es-419")).toBe("es");
	});

	it("should read three-letter codes from query parameters", async () => {
		expect(inferTag("https://example.org/page?lang=fil")).toBe("fil");
		expect(inferTag("https://example.org/page?lang=haw")).toBe("haw");
	});

	it("should ignore special-purpose codes", async () => {
		expect(inferTag("https://example.org/page?lang=und")).toBeUndefined();
		expect(inferTag("https://example.org/page?lang=mul")).toBeUndefined();
		expect(inferTag("https://example.org/page?lang=zxx")).toBeUndefined();
	});

	it("should ignore three-letter codes with no two-letter equivalent in file names", async () => {
		expect(inferTag("https://example.org/new_report.pdf")).toBeUndefined(); // not Newari
		expect(inferTag("https://example.org/report_ita.pdf")).toBe("it");
	});

	it("should read the language from language names in query parameters", async () => {
		expect(inferTag("https://example.org/page?lang=English")).toBe("en");
	});

	it("should accept parsed URLs", async () => {
		expect(inferTag(new URL("https://example.org/en/page"))).toBe("en");
	});

	it("should read the language from path segments", async () => {
		expect(inferTag("https://www.uc.pt/en/")).toBe("en");
		expect(inferTag("https://www.uc.pt/pt")).toBe("pt");
		expect(inferTag("https://apps.uc.pt/courses/EN/course/2301")).toBe("en");
		expect(inferTag("https://www.utu.fi/fi/opiskelijaksi/opiskelijan%20palvelut")).toBe("fi");
		expect(inferTag("https://example.org/en-gb/about")).toBe("en");
	});

	it("should read the language from file names", async () => {
		expect(inferTag("http://www.ag.jku.at/home_en.htm")).toBe("en");
		expect(inferTag("https://web.unipv.it/wp-content/uploads/2022/04/GEP_defSA-1_eng.pdf")).toBe("en");
		expect(inferTag("https://portale.unipv.it/files/Codice%20Etico%20%E2%80%93%20Versione%20Inglese.pdf")).toBe("en");
	});

	it("should prefer query parameters to path segments", async () => {
		expect(inferTag("https://example.org/de/page?lang=en")).toBe("en");
	});

	it("should prefer the first path segment naming a language", async () => {
		expect(inferTag("https://example.org/fr/it/page")).toBe("fr");
	});

	it("should ignore hosts", async () => {
		expect(inferTag("https://en.example.org/")).toBeUndefined();
		expect(inferTag("https://www.uni-jena.de/")).toBeUndefined();
	});

	it("should ignore the words of hyphenated slugs", async () => {
		expect(inferTag("https://example.org/universite-de-poitiers")).toBeUndefined();
		expect(inferTag("https://www.jku.at/linz-school-of-education/abteilung-fuer-bildungsforschung/")).toBeUndefined();
	});

	it("should ignore segments naming no language", async () => {
		expect(inferTag("https://example.org/xx/page")).toBeUndefined();
		expect(inferTag("https://example.org/and/the/end.pdf")).toBeUndefined();
		expect(inferTag("https://guias.usal.es/node/4945")).toBeUndefined();
		expect(inferTag("https://utuguides.fi/vaitoskirjat")).toBeUndefined();
	});

	it("should ignore path segments with three-letter codes", async () => {
		expect(inferTag("https://www.uc.pt/iii/ceis20")).toBeUndefined(); // not Sichuan Yi
		expect(inferTag("https://www.umu.se/forskning/infrastruktur/mal/")).toBeUndefined(); // not Malayalam
		expect(inferTag("https://example.org/eng/page")).toBeUndefined();
	});

	it("should read any language if no target languages are given", async () => {
		expect(inferTag("https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033202746")).toBe("id");
	});

	it("should read only target languages if given", async () => {
		expect(inferTag("https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000033202746", ["en", "fr"])).toBeUndefined();
		expect(inferTag("https://utu.zoom.us/my/kasvatustieteet", ["en", "fi"])).toBeUndefined();
		expect(inferTag("https://example.org/page?lang=de", ["en", "fr"])).toBeUndefined();
		expect(inferTag("https://example.org/Versione%20Inglese.pdf", ["it"])).toBeUndefined();
		expect(inferTag("https://example.org/de/en/page", ["en", "fr"])).toBe("en");
	});

	it("should match target languages by their base language", async () => {
		expect(inferTag("https://example.org/pt/page", ["pt-PT"])).toBe("pt");
		expect(inferTag("https://example.org/en/page", ["eng"])).toBe("en");
	});

	it("should return undefined for text that is no IRI", async () => {
		expect(inferTag("")).toBeUndefined();
		expect(inferTag("not a url")).toBeUndefined();
		expect(inferTag("mailto:user@example.org")).toBeUndefined();
	});

});
