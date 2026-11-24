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


import { reference } from "@grafctory/blue/reference";
import { multiple, optional, required, resource } from "@grafctory/blue/resource";
import { string } from "@grafctory/blue/string";
import { createLexicon } from "@grafctory/core/resource";
import { describe, expect, it } from "vitest";
import type { Endpoints } from "./endpoints.core.js";
import {
	classify,
	getModelHierarchy,
	getOwnMembers,
	getShape,
	getShapeChecks,
	getShapeId,
	getShapeName,
	nameShape,
	prefixed
} from "./shapes.core.js";


const terms = "https://example.org/terms#";
const other = "https://example.net/vocab#";
const lexicon = createLexicon({ ex: terms });


describe("getShapeId()", () => {

	const Item = resource({ class: `${terms}Item`, name: "Item" }, {});
	const Special = resource(Item, { name: "Special Item" });
	const Detail = resource({}, { code: required(string()) });

	const Items = resource({ name: "Example Items" }, {
		items: multiple(reference(Item)),
		special: multiple(reference(Special)),
		detail: optional(reference(Detail))
	});

	const endpoints: Endpoints = { "/items/": Items, "/items/:code": Item };

	it("identifies classed shapes by the slug of the prefixed name of their class", async () => {
		expect(getShapeId(endpoints, lexicon, Item)).toBe("ex-item");
	});

	it("identifies labelled class-less shapes by their label", async () => {
		expect(getShapeId(endpoints, lexicon, Items)).toBe("example-items");
	});

	it("identifies labelled refinements by their label", async () => {
		expect(getShapeId(endpoints, lexicon, Special)).toBe("special-item");
	});

	it("leaves anonymous shapes used at a single site unidentified", async () => {
		expect(getShapeId(endpoints, lexicon, Detail)).toBeUndefined();
	});

	it("leaves shapes no route reaches unidentified", async () => {
		expect(getShapeId(endpoints, lexicon, resource({ name: "Stray" }, {}))).toBeUndefined();
	});

	it("retrieves shapes by their identifier", async () => {
		expect(getShape(endpoints, lexicon, "special-item")).toBe(Special);
		expect(getShape(endpoints, lexicon, "stray")).toBeUndefined();
	});

	it("rejects class-less shapes whose label would identify them as a classed shape", async () => {

		const Clash = resource({ name: "Ex Item" }, { items: multiple(reference(Item)) });

		expect(() => getShapeId({ "/clash/": Clash }, lexicon, Clash)).toThrow(RangeError);

	});

	it("rejects class-less shapes whose label would identify them as a numbered peer", async () => {

		const First = resource({ name: "Entry" }, {});
		const Second = resource({ name: "Entry" }, {});
		const Third = resource({ name: "Entry 1" }, {});

		const Clash = resource({ name: "Entries" }, {
			first: optional(reference(First)),
			second: optional(reference(Second)),
			third: optional(reference(Third))
		});

		expect(() => getShapeId({ "/clash/": Clash }, lexicon, Clash)).toThrow(RangeError);

	});

});

describe("getShapeName()", () => {

	const Target = resource({ class: `${terms}Target`, name: "Target" }, {});
	const Thing = resource({ class: `${terms}Thing` }, {});

	const endpoints: Endpoints = { "/targets/": Target, "/things/": Thing };

	it("names the shape identified in the model by its English label", async () => {
		expect(getShapeName(endpoints, lexicon, "ex-target")).toBe("Target");
	});

	it("names label-less classed shapes by the prefixed name of their class under the lexicon", async () => {
		expect(getShapeName(endpoints, lexicon, "ex-thing")).toBe("ex:Thing");
	});

	it("names nothing for identifiers no shape of the model carries", async () => {
		expect(getShapeName(endpoints, lexicon, "ex-unknown")).toBeUndefined();
	});

});

describe("prefixed()", () => {

	it("abbreviates IRIs as prefixed names under the lexicon", async () => {
		expect(prefixed(lexicon, `${terms}Item`)).toBe("ex:Item");
	});

	it("leaves IRIs no prefix of the lexicon applies to whole", async () => {
		expect(prefixed(lexicon, `${other}Item`)).toBe(`${other}Item`);
	});

});

describe("getShapeChecks()", () => {

	it("lists the names of the custom checks", async () => {

		const checks = getShapeChecks(resource({ validators: [function consistent() { return undefined; }] }, {}));

		expect(checks).toEqual(["consistent"]);

	});

	it("lists unnamed checks as check", async () => {

		const checks = getShapeChecks(resource({ validators: [() => undefined] }, {}));

		expect(checks).toEqual(["check"]);

	});

});

describe("classify()", () => {

	it("identifies classed shapes by the slug of the prefixed name of their class", async () => {

		const Course = resource({ class: `${terms}CourseUnit` }, {});

		expect(classify([Course], lexicon).get(Course)).toBe("ex-courseunit");

	});

	it("identifies classes in the default namespace by the slug of their local name", async () => {

		const Course = resource({ class: `${terms}Course` }, {});

		expect(classify([Course], createLexicon({ "": terms })).get(Course)).toBe("course");

	});

	it("leaves shapes stating no class unidentified", async () => {

		const Mixin = resource({ name: "Mixin" }, {});

		expect(classify([Mixin], lexicon).has(Mixin)).toBe(false);

	});

	it("identifies deferred shapes", async () => {

		const Course = resource({ class: `${terms}Course` }, {});

		expect([...classify([() => Course], lexicon).values()]).toEqual(["ex-course"]);

	});

	it("identifies a shape listed more than once", async () => {

		const Course = resource({ class: `${terms}Course` }, {});

		expect(classify([Course, Course], lexicon).get(Course)).toBe("ex-course");

	});

	it("rejects shapes stating the same class", async () => {

		const Course = resource({ class: `${terms}Course` }, {});
		const Duplicate = resource({ class: `${terms}Course`, name: "Duplicate" }, {});

		expect(() => classify([Course, Duplicate], lexicon)).toThrow(RangeError);

	});

	it("rejects shapes stating classes differing in case alone", async () => {

		const Course = resource({ class: `${terms}Course` }, {});
		const Lower = resource({ class: `${terms}course` }, {});

		expect(() => classify([Course, Lower], lexicon)).toThrow(RangeError);

	});

	it("rejects shapes stating classes whose prefixed names share a slug", async () => {

		const Underscored = resource({ class: `${terms}Course_Unit` }, {});
		const Hyphenated = resource({ class: `${terms}Course-Unit` }, {});

		expect(() => classify([Underscored, Hyphenated], lexicon)).toThrow(RangeError);

	});

	it("rejects shapes stating classes whose prefix and local name share a slug across the colon", async () => {

		const Prefixed = resource({ class: `${other}Unit` }, {});
		const Local = resource({ class: `${terms}Vocab-Unit` }, {});

		expect(() => classify([Prefixed, Local], createLexicon({ ex: terms, "ex-vocab": other }))).toThrow(RangeError);

	});

	it("rejects classes whose namespace has no prefix", async () => {

		const Foreign = resource({ class: `${other}Foreign` }, {});

		expect(() => classify([Foreign], lexicon)).toThrow(RangeError);

	});

});

describe("nameShape()", () => {

	describe("labelled shapes", () => {

		it("names shapes by their label in the target language", async () => {

			const Course = resource({ name: { en: "Course", it: "Corso" }, class: `${terms}Course` }, {});

			expect(nameShape(Course, lexicon, "it")).toBe("Corso");

		});

		it("targets English by default", async () => {

			const Course = resource({ name: { en: "Course", it: "Corso" } }, {});

			expect(nameShape(Course, lexicon)).toBe("Course");

		});

	});

	describe("classed shapes", () => {

		it("names shapes stating no label by the prefixed name of their class", async () => {

			const Course = resource({ class: `${terms}Course` }, {});

			expect(nameShape(Course, lexicon)).toBe("ex:Course");

		});

		it("falls back to the class when no label is stated in the target language", async () => {

			const Course = resource({ name: { it: "Corso" }, class: `${terms}Course` }, {});

			expect(nameShape(Course, lexicon)).toBe("ex:Course");

		});

		it("names classes with no prefix by their IRI", async () => {

			const Course = resource({ class: "https://example.net/vocab#Course" }, {});

			expect(nameShape(Course, lexicon)).toBe("https://example.net/vocab#Course");

		});

	});

	describe("label-less class-less shapes", () => {

		it("names shapes by the shape they extend", async () => {

			const Topic = resource({ name: "Topic" }, {});

			expect(nameShape(resource(Topic, { pattern: "https://example.org/topics/*" }), lexicon)).toBe("Topic");

		});

		it("names shapes by the shapes they extend, joined", async () => {

			const Entity = resource({ name: "Entity" }, {});
			const Point = resource({ class: `${terms}Point` }, {});

			expect(nameShape(resource(Entity, Point), lexicon)).toBe("Entity & ex:Point");

		});

		it("names shapes extending only label-less class-less shapes after their ancestors", async () => {

			const Topic = resource({ name: "Topic" }, {});
			const Refined = resource(Topic, { pattern: "https://example.org/topics/*" });

			expect(nameShape(resource(Refined, { hasValue: ["https://example.org/topics/x"] }), lexicon)).toBe("Topic");

		});

		it("names shapes extending nothing as objects", async () => {
			expect(nameShape(resource({}, {}), lexicon)).toBe("Object");
		});

	});

	it("names deferred shapes", async () => {

		const Course = resource({ name: "Course" }, {});

		expect(nameShape(() => Course, lexicon)).toBe("Course");

	});

});

describe("getOwnMembers()", () => {

	const Target = resource({ class: `${terms}Target` }, {});
	const Other = resource({ class: `${terms}Other` }, {});

	const Parent = resource({}, {
		label: required(string()),
		notes: multiple(string()),
		link: optional(reference(Target))
	});

	it("lists every member of shapes extending nothing", async () => {
		expect(Object.keys(getOwnMembers(Parent))).toEqual(["label", "notes", "link"]);
	});

	it("lists members no extended shape states", async () => {

		const Child = resource(Parent, {}, { extra: optional(string()) });

		expect(Object.keys(getOwnMembers(Child))).toEqual(["extra"]);

	});

	it("leaves out members inherited unchanged", async () => {

		const Child = resource(Parent, {}, {});

		expect(getOwnMembers(Child)).toEqual({});

	});

	it("lists members narrowing their bounds", async () => {

		const Child = resource(Parent, {}, { notes: optional(string()) });

		expect(Object.keys(getOwnMembers(Child))).toEqual(["notes"]);

	});

	it("lists members narrowing the shape of their values", async () => {

		const Child = resource(Parent, {}, { label: required(string({ maxLength: 10 })) });

		expect(Object.keys(getOwnMembers(Child))).toEqual(["label"]);

	});

	it("compares linked shapes by identity", async () => {

		const Refined = resource(Target, { pattern: "https://example.org/targets/*" });
		const Child = resource(Parent, {}, { link: optional(reference(Refined)) });

		expect(Object.keys(getOwnMembers(Child))).toEqual(["link"]);
		expect(getOwnMembers(resource(Parent, {}, { link: optional(reference(Target)) }))).toEqual({});
		expect(Object.keys(getOwnMembers(resource({}, { link: optional(reference(Other)) })))).toEqual(["link"]);

	});

	it("leaves out members restated with a different description alone", async () => {

		const Child = resource(Parent, {}, { label: required(string(), { description: "A restated description." }) });

		expect(getOwnMembers(Child)).toEqual({});

	});

	it("leaves out members inherited unchanged from any of several extended shapes", async () => {

		const Second = resource({}, { code: required(string()) });
		const Child = resource(Parent, Second, {}, {});

		expect(getOwnMembers(Child)).toEqual({});

	});

	it("retrieves the own members of deferred shapes", async () => {

		const Child = resource(Parent, {}, { extra: optional(string()) });

		expect(Object.keys(getOwnMembers(() => Child))).toEqual(["extra"]);

	});

});

describe("getModelHierarchy()", () => {

	const lexicon = createLexicon({});

	const Aardvark = resource({ name: "Aardvark" }, {});
	const Zebra = resource({ name: "Zebra" }, {});
	const Wolf = resource(Zebra, { name: "Wolf" });

	const Betas = resource({ name: "Betas" }, {
		aardvark: optional(reference(Aardvark)),
		wolf: optional(reference(Wolf))
	});
	const Alphas = resource({ name: "Alphas" }, {});

	const endpoints: Endpoints = { "/betas/": Betas, "/alphas/": Alphas };

	function listed() {
		return getModelHierarchy(endpoints, lexicon).map(({ href, depth }) => [href, depth]);
	}

	it("lists the entry shapes first, in the order their routes are given", async () => {
		expect(listed().slice(0, 2)).toEqual([["betas", 0], ["alphas", 0]]);
	});

	it("lists the other shapes after the entry shapes, sorted by name", async () => {
		expect(listed().slice(2).filter(([, depth]) => depth === 0)).toEqual([["aardvark", 0], ["zebra", 0]]);
	});

	it("nests each shape under the shapes it extends", async () => {
		expect(listed()).toContainEqual(["wolf", 1]);
	});

});
