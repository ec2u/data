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

import { dictionary } from "@metreeca/blue/dictionary";
import { integer } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, optional, property, required, resource, type } from "@metreeca/blue/resource";
import { email, string, url } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { createLexicon } from "@metreeca/core/resource";
import { describe, expect, it } from "vitest";
import type { Endpoints } from "./endpoints.core.js";
import type { ShapeMember } from "./index.core.js";
import { getShapeTable } from "./properties.core.js";


const terms = "https://example.org/terms#";
const endpoints: Endpoints = {};
const lexicon = createLexicon({});

const Target = resource({ class: `${terms}Target`, name: "Target" }, {});


describe("getShapeTable()", () => {

	function row(rows: readonly ShapeMember[], term: string): ShapeMember | undefined {
		return rows.find(row => row.term === term);
	}

	describe("identifier and class members", () => {

		const Item = resource({

			class: `${terms}Item`,
			pattern: "https://example.org/items/{code}",
			in: ["https://example.org/items/a", "https://example.org/items/b"]

		}, {

			id: id(),
			type: type()

		});

		it("lists the identifier member with the restrictions on identifiers", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, Item);

			expect(row(rows, "id")).toMatchObject({
				types: [{
					name: "iri",
					restrictions: {
						template: "https://example.org/items/{code}",
						in: ["https://example.org/items/a", "https://example.org/items/b"]
					}
				}],
				minCount: 1,
				maxCount: 1
			});

		});

		it("lists the class member with the class as its required value", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, Item);

			expect(row(rows, "type")).toMatchObject({
				types: [{ name: "iri", restrictions: { hasValue: [`${terms}Item`] } }],
				minCount: 1,
				maxCount: 1
			});

		});

		it("marks the identifier and class members as managed", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, Item);

			expect(row(rows, "id")?.managed).toBe(true);
			expect(row(rows, "type")?.managed).toBe(true);

		});

		it("leaves the class member out on shapes stating no class", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, { type: type() }));

			expect(row(rows, "type")).toBeUndefined();

		});

		it("leaves hidden identifier members out", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, { id: id({ hidden: true }) }));

			expect(row(rows, "id")).toBeUndefined();

		});

	});

	describe("properties", () => {

		it("states the English label", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, { code: required(string(), { name: "Item Code" }) }));

			expect(row(rows, "code")?.label).toBe("Item Code");

		});

		it("states the bounds on the number of values", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				few: property(string(), { minCount: 2, maxCount: 5 }),
				many: multiple(string())
			}));

			expect(row(rows, "few")).toMatchObject({ minCount: 2, maxCount: 5 });
			expect(row(rows, "many")).toMatchObject({ minCount: 0, maxCount: undefined });

		});

		it("leaves out predicates in the default namespace", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, { code: required(string()) }));

			expect(row(rows, "code")?.predicate).toBeUndefined();

		});

		it("keeps forward and inverse predicates apart", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				parts: multiple(reference(Target), { reverse: `${terms}partOf` })
			}));

			expect(row(rows, "parts")).toMatchObject({ predicate: undefined, reverse: `${terms}partOf` });

		});

		it("flags foreign and captive properties", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				owned: multiple(reference(Target), { reverse: `${terms}partOf`, foreign: true }),
				bound: multiple(reference(Target), { captive: true })
			}));

			expect(row(rows, "owned")).toMatchObject({ foreign: true, captive: false, managed: false });
			expect(row(rows, "bound")).toMatchObject({ foreign: false, captive: true, managed: false });

		});

	});

	describe("value types", () => {

		it("names the shorthand plain values were defined with, linked to its datatype entry in the models index", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				mail: optional(email()),
				home: optional(url())
			}));

			expect(row(rows, "mail")?.types).toEqual([{
				name: "email",
				href: "./#datatype-email",
				kind: "string",
				restrictions: {}
			}]);
			expect(row(rows, "home")?.types).toEqual([{
				name: "url",
				href: "./#datatype-url",
				kind: "string",
				restrictions: {}
			}]);

		});

		it("links localised text to the dictionary datatype entry", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, { label: optional(dictionary()) }));

			expect(row(rows, "label")?.types).toMatchObject([{ name: "Dictionary", href: "./#datatype-dictionary" }]);

		});

		it("states the restrictions beyond the ones the shorthand implies", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				code: required(string({ pattern: "^[A-Z]+$", maxLength: 8 })),
				count: required(integer({ minInclusive: 1 })),
				label: optional(dictionary({ uniqueLang: true, languageIn: ["en"] }))
			}));

			expect(row(rows, "code")?.types).toMatchObject([{ restrictions: { pattern: "^[A-Z]+$", maxLength: 8 } }]);
			expect(row(rows, "count")?.types).toMatchObject([{ restrictions: { minInclusive: 1 } }]);
			expect(row(rows, "label")?.types).toMatchObject([{
				name: "Dictionary",
				restrictions: { uniqueLang: true, languageIn: ["en"] }
			}]);

		});

		it("states the restrictions of each alternative apart", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				either: required(union(string({ maxLength: 8 }), dictionary({ maxLength: 100 })))
			}));

			expect(row(rows, "either")?.types).toMatchObject([
				{ name: "string", restrictions: { maxLength: 8 } },
				{ name: "Dictionary", restrictions: { maxLength: 100 } }
			]);

		});

	});

	describe("linked resources", () => {

		it("states the restrictions on the identifiers of the linked shape", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				fixed: required(reference(resource(Target, { hasValue: ["https://example.org/targets/x"] }))),
				listed: required(reference(resource(Target, { in: ["https://example.org/targets/y"] }))),
				ranged: required(reference(resource(Target, { pattern: "https://example.org/targets/*" })))
			}));

			expect(row(rows, "fixed")?.types).toMatchObject([{ restrictions: { hasValue: ["https://example.org/targets/x"] } }]);
			expect(row(rows, "listed")?.types).toMatchObject([{ restrictions: { in: ["https://example.org/targets/y"] } }]);
			expect(row(rows, "ranged")?.types).toMatchObject([{ restrictions: { template: "https://example.org/targets/*" } }]);

		});

		it("links anonymous refinements to the shape they refine", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				refined: required(reference(resource(Target, { hasValue: ["https://example.org/targets/x"] })))
			}));

			expect(row(rows, "refined")?.types).toMatchObject([{ name: "Target" }]);

		});

		it("keeps refinements stating a name of their own apart from the shape they refine", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				named: required(reference(resource(Target, { name: "Special Target" })))
			}));

			expect(row(rows, "named")?.types).toMatchObject([{ name: "Special Target" }]);

		});

		it("states the members inlined refinements add to the shape they refine", async () => {

			const { rows } = getShapeTable(endpoints, lexicon, resource({}, {
				extended: required(resource(Target, {}, { extra: optional(string()) }))
			}));

			expect(row(rows, "extended")?.types).toMatchObject([{
				name: "Target",
				restrictions: { members: ["extra"] }
			}]);

		});

	});

});
