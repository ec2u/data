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

import { boolean } from "@metreeca/blue/boolean";
import { dictionary } from "@metreeca/blue/dictionary";
import { decimal, integer } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { id, type Members, multiple, optional, property, required, resource, type } from "@metreeca/blue/resource";
import { email, string, url } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { isObject } from "@metreeca/core";
import { describe, expect, it } from "vitest";
import { getShapeInterface, getShapeSchema, type ShapeRow, tabulate } from "./shape.core.js";


const terms = "https://example.org/terms#";

const Target = resource({ class: `${terms}Target` }, {});


function row(rows: readonly ShapeRow[], term: string): ShapeRow | undefined {
	return rows.find(row => row.term === term);
}


describe("tabulate()", () => {

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

			const { rows } = tabulate(Item);

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

			const { rows } = tabulate(Item);

			expect(row(rows, "type")).toMatchObject({
				types: [{ name: "iri", restrictions: { hasValue: [`${terms}Item`] } }],
				minCount: 1,
				maxCount: 1
			});

		});

		it("marks the identifier and class members as managed", async () => {

			const { rows } = tabulate(Item);

			expect(row(rows, "id")?.managed).toBe(true);
			expect(row(rows, "type")?.managed).toBe(true);

		});

		it("leaves the class member out on shapes stating no class", async () => {

			const { rows } = tabulate(resource({}, { type: type() }));

			expect(row(rows, "type")).toBeUndefined();

		});

		it("leaves hidden identifier members out", async () => {

			const { rows } = tabulate(resource({}, { id: id({ hidden: true }) }));

			expect(row(rows, "id")).toBeUndefined();

		});

	});

	describe("properties", () => {

		it("states the English label", async () => {

			const { rows } = tabulate(resource({}, { code: required(string(), { name: "Item Code" }) }));

			expect(row(rows, "code")?.label).toBe("Item Code");

		});

		it("states the bounds on the number of values", async () => {

			const { rows } = tabulate(resource({}, {
				few: property(string(), { minCount: 2, maxCount: 5 }),
				many: multiple(string())
			}));

			expect(row(rows, "few")).toMatchObject({ minCount: 2, maxCount: 5 });
			expect(row(rows, "many")).toMatchObject({ minCount: 0, maxCount: undefined });

		});

		it("leaves out predicates in the default namespace", async () => {

			const { rows } = tabulate(resource({}, { code: required(string()) }));

			expect(row(rows, "code")?.predicate).toBeUndefined();

		});

		it("keeps forward and inverse predicates apart", async () => {

			const { rows } = tabulate(resource({}, {
				parts: multiple(reference(Target), { reverse: `${terms}partOf` })
			}));

			expect(row(rows, "parts")).toMatchObject({ predicate: undefined, reverse: `${terms}partOf` });

		});

		it("flags foreign and captive properties", async () => {

			const { rows } = tabulate(resource({}, {
				owned: multiple(reference(Target), { reverse: `${terms}partOf`, foreign: true }),
				bound: multiple(reference(Target), { captive: true })
			}));

			expect(row(rows, "owned")).toMatchObject({ foreign: true, captive: false, managed: false });
			expect(row(rows, "bound")).toMatchObject({ foreign: false, captive: true, managed: false });

		});

	});

	describe("value types", () => {

		it("names the shorthand plain values were defined with", async () => {

			const { rows } = tabulate(resource({}, { mail: optional(email()), home: optional(url()) }));

			expect(row(rows, "mail")?.types).toEqual([{ name: "email", href: undefined, restrictions: {} }]);
			expect(row(rows, "home")?.types).toEqual([{ name: "url", href: undefined, restrictions: {} }]);

		});

		it("states the restrictions beyond the ones the shorthand implies", async () => {

			const { rows } = tabulate(resource({}, {
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

			const { rows } = tabulate(resource({}, {
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

			const { rows } = tabulate(resource({}, {
				fixed: required(reference(resource(Target, { hasValue: ["https://example.org/targets/x"] }))),
				listed: required(reference(resource(Target, { in: ["https://example.org/targets/y"] }))),
				ranged: required(reference(resource(Target, { pattern: "https://example.org/targets/*" })))
			}));

			expect(row(rows, "fixed")?.types).toMatchObject([{ restrictions: { hasValue: ["https://example.org/targets/x"] } }]);
			expect(row(rows, "listed")?.types).toMatchObject([{ restrictions: { in: ["https://example.org/targets/y"] } }]);
			expect(row(rows, "ranged")?.types).toMatchObject([{ restrictions: { template: "https://example.org/targets/*" } }]);

		});

	});

	describe("custom checks", () => {

		it("lists the names of the custom checks", async () => {

			const { checks } = tabulate(resource({ validators: [function consistent() { return undefined; }] }, {}));

			expect(checks).toEqual(["consistent"]);

		});

		it("lists unnamed checks as check", async () => {

			const { checks } = tabulate(resource({ validators: [() => undefined] }, {}));

			expect(checks).toEqual(["check"]);

		});

	});

});


describe("getShapeInterface()", () => {

	function member(shape: Parameters<typeof getShapeInterface>[0], term: string) {
		return getShapeInterface(shape).members.find(member => member.term === term);
	}

	it("states the identifier and class members as managed strings", async () => {

		const Item = resource({ class: `${terms}Item` }, { id: id(), type: type() });

		expect(member(Item, "id")).toMatchObject({ types: [{ name: "string" }], optional: false, managed: true });
		expect(member(Item, "type")).toMatchObject({ types: [{ name: "string" }], optional: false, managed: true });

	});

	it("leaves the class member out on shapes stating no class", async () => {

		expect(member(resource({}, { type: type() }), "type")).toBeUndefined();

	});
	it("carries localised text apart, never arrayed", async () => {

		const shape = resource({}, {
			labels: multiple(dictionary({ uniqueLang: true })),
			notes: multiple(dictionary())
		});

		expect(member(shape, "labels")).toMatchObject({
			types: [],
			plural: false,
			dictionary: { name: "Dictionary", restrictions: { uniqueLang: true } }
		});

		expect(member(shape, "notes")?.dictionary?.restrictions.uniqueLang).toBeFalsy();

	});

	it("leaves out predicates in the default namespace", async () => {

		expect(member(resource({}, { code: required(string()) }), "code")?.predicate).toBeUndefined();

	});

	it("states the bounds on the number of values", async () => {

		const shape = resource({}, { few: property(string(), { minCount: 2, maxCount: 5 }) });

		expect(member(shape, "few")).toMatchObject({ optional: false, plural: true, minCount: 2, maxCount: 5 });

	});

	it("states labels, inverse predicates, flags and restrictions", async () => {

		const shape = resource({}, {
			code: required(string({ maxLength: 8 }), { name: "Item Code" }),
			parts: multiple(reference(Target), { reverse: `${terms}partOf`, foreign: true })
		});

		expect(member(shape, "code")).toMatchObject({
			label: "Item Code",
			types: [{ name: "string", restrictions: { maxLength: 8 } }]
		});

		expect(member(shape, "parts")).toMatchObject({ reverse: `${terms}partOf`, foreign: true });

	});

});


describe("getShapeSchema()", () => {

	function schema(members: Members): Readonly<Record<string, unknown>> {

		const { properties } = getShapeSchema(resource({}, members));

		return isObject(properties) ? properties : {};

	}

	describe("strings", () => {

		it("states formats for the shorthands JSON Schema names", async () => {

			const { mail, home } = schema({ mail: optional(email()), home: optional(url()) });

			expect(mail).toMatchObject({ type: "string", format: "email" });
			expect(home).toMatchObject({ type: "string", format: "uri" });

		});

		it("states patterns, lengths and enumerations", async () => {

			const { code, kind } = schema({
				code: required(string({ pattern: "^[A-Z]+$", minLength: 2, maxLength: 8 })),
				kind: required(string({ in: ["a", "b"] }))
			});

			expect(code).toMatchObject({ pattern: "^[A-Z]+$", minLength: 2, maxLength: 8 });
			expect(kind).toMatchObject({ enum: ["a", "b"] });

		});

	});

	describe("numbers and booleans", () => {

		it("states integral numbers and their limits", async () => {

			const { count, ratio } = schema({
				count: required(integer({ minInclusive: 1 })),
				ratio: required(decimal({ maxExclusive: 1 }))
			});

			expect(count).toMatchObject({ type: "integer", minimum: 1 });
			expect(ratio).toMatchObject({ type: "number", exclusiveMaximum: 1 });

		});

		it("states fixed booleans", async () => {

			const { flag } = schema({ flag: required(boolean({ in: true })) });

			expect(flag).toMatchObject({ type: "boolean", const: true });

		});

	});

	describe("localised text", () => {

		it("maps tags to strings or arrays of strings, never wrapped in an array", async () => {

			const { label, notes } = schema({
				label: multiple(dictionary({ uniqueLang: true })),
				notes: multiple(dictionary())
			});

			expect(label).toMatchObject({ type: "object", additionalProperties: { type: "string" } });
			expect(notes).toMatchObject({ type: "object", additionalProperties: { type: "array", items: { type: "string" } } });

		});

		it("bounds tags and string lengths", async () => {

			const { label } = schema({ label: optional(dictionary({ uniqueLang: true, languageIn: ["en"], maxLength: 100 })) });

			expect(label).toMatchObject({
				propertyNames: { pattern: "^(?:en)(?:-|$)" },
				additionalProperties: { type: "string", maxLength: 100 }
			});

		});

	});

	describe("properties", () => {

		it("states array bounds", async () => {

			const { few } = schema({ few: property(string(), { minCount: 2, maxCount: 5 }) });

			expect(few).toMatchObject({ type: "array", minItems: 2, maxItems: 5 });

		});

		it("states labels as titles and inverse predicates", async () => {

			const { parts } = schema({ parts: multiple(reference(Target), { name: "Parts", reverse: `${terms}partOf` }) });

			expect(parts).toMatchObject({ title: "Parts", $comment: `^${terms}partOf` });

		});

		it("states read-only and bound properties", async () => {

			const { parts } = schema({
				parts: multiple(reference(Target), { reverse: `${terms}partOf`, foreign: true, captive: true })
			});

			expect(parts).toMatchObject({ readOnly: true, "x-foreign": true, "x-lifecycle": "bound" });

		});

		it("annotates the identifier constraints of linked resources", async () => {

			const { fixed } = schema({
				fixed: required(reference(resource(Target, { hasValue: ["https://example.org/targets/x"] })))
			});

			expect(fixed).toMatchObject({ "x-value": ["https://example.org/targets/x"] });

		});

	});

	describe("identifier, class and checks", () => {

		it("states the identifier and class members", async () => {

			const { properties } = getShapeSchema(resource({
				class: `${terms}Item`,
				pattern: "/items/{code}"
			}, { id: id(), type: type() }));

			expect(properties).toMatchObject({
				id: { type: "string", format: "iri", "x-id": "/items/{code}" },
				type: { const: `${terms}Item` }
			});

		});

		it("states the identifier and class members as read-only and required", async () => {

			const value = getShapeSchema(resource({ class: `${terms}Item` }, { id: id(), type: type() }));

			expect(value).toMatchObject({
				properties: { id: { readOnly: true }, type: { readOnly: true } },
				required: ["id", "type"]
			});

		});

		it("leaves the class member out on shapes stating no class", async () => {

			const value = getShapeSchema(resource({}, { id: id(), type: type() }));

			expect(value).toMatchObject({ required: ["id"] });
			expect(value.properties).not.toHaveProperty("type");

		});

		it("lists custom checks", async () => {

			const value = getShapeSchema(resource({ validators: [function consistent() { return undefined; }] }, {}));

			expect(value).toMatchObject({ "x-checks": ["consistent"] });

		});

	});

});
