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
import { datatypes, getDatatype, getDatatypeAnchor } from "./datatypes.core.js";


describe("datatypes", () => {

	it("lists each datatype once", async () => {

		const names = datatypes.map(({ name }) => name);

		expect(names.length).toBeGreaterThan(0);
		expect(new Set(names).size).toBe(names.length);

	});

	it("groups datatypes by the kind of value they admit, each group listed in one run", async () => {

		const groups = datatypes.map(({ group }) => group);

		expect([...new Set(groups)]).toEqual(["boolean", "number", "string", "identifier", "temporal", "dictionary"]);
		expect(groups.filter((group, index) => group !== groups[index-1]).length).toBe(6);

	});

	it("names datatypes safely as anchors", async () => {
		expect(datatypes.every(({ name }) => /^[a-z]+$/.test(name))).toBe(true);
	});

	it("warns about temporal datatypes other than instants and timestamps", async () => {
		expect(getDatatype("date")?.warning).toBeDefined();
		expect(getDatatype("instant")?.warning).toBeUndefined();
	});

});

describe("getDatatype()", () => {

	it("looks up datatypes by name", async () => {
		expect(getDatatype("date")).toMatchObject({
			name: "date",
			rdf: "http://www.w3.org/2001/XMLSchema#date",
			spec: "https://www.w3.org/TR/xmlschema-2/#date"
		});
	});

	it("links localised text to the RDF Schema definition of language-tagged strings", async () => {
		expect(getDatatype("dictionary")?.spec).toBe("https://www.w3.org/TR/rdf-schema/#ch_langstring");
	});

	it("matches names regardless of case", async () => {
		expect(getDatatype("Dictionary")?.name).toBe("dictionary");
	});

	it("finds nothing for unknown names", async () => {
		expect(getDatatype("unknown")).toBeUndefined();
	});

});

describe("getDatatypeAnchor()", () => {

	it("names anchors after the datatype", async () => {
		expect(getDatatypeAnchor("date")).toBe("datatype-date");
	});

});

describe("datatype groups", () => {

	it("sets identifiers apart from plain text", async () => {
		expect(["email", "phone", "tag", "iri", "url"].map(name => getDatatype(name)?.group))
			.toEqual(Array(5).fill("identifier"));
	});

	it("sets temporal values apart from other strings", async () => {
		expect(["year", "date", "time", "instant", "timestamp", "duration"].map(name => getDatatype(name)?.group))
			.toEqual(Array(6).fill("temporal"));
	});

});
