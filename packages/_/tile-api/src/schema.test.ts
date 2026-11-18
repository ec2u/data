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

import { boolean } from "@metreeca/blue/boolean";
import { dictionary } from "@metreeca/blue/dictionary";
import { decimal, integer } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { id, type Members, multiple, optional, property, required, resource, type } from "@metreeca/blue/resource";
import { email, string, url } from "@metreeca/blue/string";
import { isObject } from "@metreeca/core";
import { createLexicon } from "@metreeca/core/resource";
import { describe, expect, it } from "vitest";
import type { Endpoints } from "./endpoints.core.js";
import { getShapeSchema } from "./schema.core.js";


const terms = "https://example.org/terms#";
const endpoints: Endpoints = {};
const lexicon = createLexicon({});

const Target = resource({ class: `${terms}Target`, name: "Target" }, {});


describe("getShapeSchema()", () => {

	function schema(members: Members): Readonly<Record<string, unknown>> {

		const { properties } = getShapeSchema(endpoints, lexicon, resource({}, members));

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
			expect(notes).toMatchObject({
				type: "object",
				additionalProperties: { type: "array", items: { type: "string" } }
			});

		});

		it("bounds tags and string lengths", async () => {

			const { label } = schema({
				label: optional(dictionary({
					uniqueLang: true,
					languageIn: ["en"],
					maxLength: 100
				}))
			});

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

			const { parts } = schema({
				parts: multiple(reference(Target), {
					name: "Parts",
					reverse: `${terms}partOf`
				})
			});

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

			const { properties } = getShapeSchema(endpoints, lexicon, resource({
				class: `${terms}Item`,
				pattern: "/items/{code}"
			}, { id: id(), type: type() }));

			expect(properties).toMatchObject({
				id: { type: "string", format: "iri", "x-id": "/items/{code}" },
				type: { const: `${terms}Item` }
			});

		});

		it("states the identifier and class members as read-only and required", async () => {

			const value = getShapeSchema(endpoints, lexicon, resource({ class: `${terms}Item` }, {
				id: id(),
				type: type()
			}));

			expect(value).toMatchObject({
				properties: { id: { readOnly: true }, type: { readOnly: true } },
				required: ["id", "type"]
			});

		});

		it("leaves the class member out on shapes stating no class", async () => {

			const value = getShapeSchema(endpoints, lexicon, resource({}, { id: id(), type: type() }));

			expect(value).toMatchObject({ required: ["id"] });
			expect(value.properties).not.toHaveProperty("type");

		});

		it("lists custom checks", async () => {

			const value = getShapeSchema(endpoints, lexicon, resource({ validators: [function consistent() { return undefined; }] }, {}));

			expect(value).toMatchObject({ "x-checks": ["consistent"] });

		});

	});

});
