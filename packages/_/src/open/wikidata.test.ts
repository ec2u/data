/*
 * Copyright © 2013-2026 Metreeca srl
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
import { wb, wd, wdp, wdt, Wikidata } from "./wikidata.js";


describe("namespaces", () => {

	it("should resolve Wikibase ontology terms", async () => {
		expect(wb[""]).toBe("http://wikiba.se/ontology#");
		expect(wb.Item).toBe("http://wikiba.se/ontology#Item");
	});

	it("should resolve entities", async () => {
		expect(wd[""]).toBe("http://www.wikidata.org/entity/");
		expect(wd.Q42).toBe("http://www.wikidata.org/entity/Q42");
	});

	it("should resolve properties", async () => {
		expect(wdp[""]).toBe("http://www.wikidata.org/prop/");
		expect(wdp.P31).toBe("http://www.wikidata.org/prop/P31");
	});

	it("should resolve direct properties", async () => {
		expect(wdt[""]).toBe("http://www.wikidata.org/prop/direct/");
		expect(wdt.P31).toBe("http://www.wikidata.org/prop/direct/P31");
	});

});

describe("Wikidata", () => {

	it("should expose the query service endpoint", async () => {
		expect(Wikidata.Endpoint).toBe("https://query.wikidata.org/sparql");
	});

	it("should expose Wikibase ontology terms", async () => {
		expect(Wikidata.Item).toBe("http://wikiba.se/ontology#Item");
		expect(Wikidata.Property).toBe("http://wikiba.se/ontology#Property");
		expect(Wikidata.Sitelinks).toBe("http://wikiba.se/ontology#sitelinks");
	});

	it("should expose direct properties", async () => {
		expect(Wikidata.P31).toBe("http://www.wikidata.org/prop/direct/P31");
		expect(Wikidata.P279).toBe("http://www.wikidata.org/prop/direct/P279");
		expect(Wikidata.P1647).toBe("http://www.wikidata.org/prop/direct/P1647");
		expect(Wikidata.P625).toBe("http://www.wikidata.org/prop/direct/P625");
		expect(Wikidata.P1549).toBe("http://www.wikidata.org/prop/direct/P1549");
	});

	it("should expose entities", async () => {
		expect(Wikidata.Q4167410).toBe("http://www.wikidata.org/entity/Q4167410");
	});

	it("should expose name properties", async () => {
		expect(Wikidata.Names).toEqual([
			"http://www.w3.org/2000/01/rdf-schema#label",
			"http://www.w3.org/2004/02/skos/core#altLabel"
		]);
	});

});
