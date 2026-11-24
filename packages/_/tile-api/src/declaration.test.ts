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

import { dictionary } from "@grafctory/blue/dictionary";
import { reference } from "@grafctory/blue/reference";
import { id, multiple, property, required, resource, type } from "@grafctory/blue/resource";
import { string } from "@grafctory/blue/string";
import { createLexicon } from "@grafctory/core/resource";
import { describe, expect, it } from "vitest";
import { getShapeInterface } from "./declaration.core.js";
import type { Endpoints } from "./endpoints.core.js";


const terms = "https://example.org/terms#";
const endpoints: Endpoints = {};
const lexicon = createLexicon({});

const Target = resource({ class: `${terms}Target`, name: "Target" }, {});


describe("getShapeInterface()", () => {

	function member(shape: Parameters<typeof getShapeInterface>[2], term: string) {
		return getShapeInterface(endpoints, lexicon, shape).members.find(member => member.term === term);
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
