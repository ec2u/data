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

import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { EuroSciVocTopic } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import { boolean } from "@metreeca/blue/boolean";
import { dictionary } from "@metreeca/blue/dictionary";
import { integer } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { multiple, nonempty, optional, property, required, resource } from "@metreeca/blue/resource";
import { string, year } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { createNamespace } from "@metreeca/core/resource";
import { describe, expect, it } from "vitest";
import { getShapeDescription, getShapeHref, getShapeName, getShapeReferrers, tabulate } from "./shape.core.js";


const test = createNamespace("https://example.org/terms#");


function Thing() {
	return resource({

		space: test,
		class: test.Thing,
		pattern: "https://example.org/things/{code}",

		name: "Thing",
		description: `
			A thing
			described at length.
		`

	}, {

		label: required(dictionary(), { description: "The label of the thing." }),
		code: optional(string()),
		hidden: optional(string(), { hidden: true }),
		peer: optional(reference(Part))

	});
}

function Mixin() {
	return resource({ space: test }, { mixed: optional(string()) });
}

function Item() {
	return resource(Thing, Mixin, {

		space: test,
		class: test.Item,

		name: "Item"

	}, {

		year: required(year()),
		count: optional(integer()),
		flags: multiple(boolean()),
		parts: nonempty(reference(Part)),
		pairs: property(string(), { minCount: 2, maxCount: 5 }),
		some: property(string(), { minCount: 2 }),
		either: optional(union(string(), reference(Part))),
		owner: optional(reference(Thing), { reverse: test.thing })

	});
}

function Bare() {
	return resource({ name: "Bare" });
}

function Part() {
	return resource({

		space: test,
		class: test.Part,
		pattern: "https://example.org/",

		name: { it: "Parte" }

	}, {

		item: optional(reference(Item), { forward: test.item })

	});
}


describe("getShapeName()", () => {

	it("names a shape after its English name", () => {
		expect(getShapeName(Thing)).toBe("Thing");
	});

	it("names a shape stating no English name after its class", () => {
		expect(getShapeName(Part)).toBe("Part");
	});

	it("names a shape stating neither name nor class after its nearest named ancestor", () => {
		expect(getShapeName(EuroSciVocTopic)).toBe("Topic");
	});

});

describe("getShapeDescription()", () => {

	it("describes a shape by its English description, with whitespace collapsed", () => {
		expect(getShapeDescription(Thing)).toBe("A thing described at length.");
	});

	it("describes no shape stating no English description", () => {
		expect(getShapeDescription(Part)).toBeUndefined();
	});

});

describe("getShapeHref()", () => {

	it("locates a shape on the introduction of the catalogue its pattern is rooted in", () => {
		expect(getShapeHref(Thing)).toBe("/things/~#Thing");
	});

	it("locates a shape inheriting its pattern under its own name", () => {
		expect(getShapeHref(Item)).toBe("/things/~#Item");
	});

	it("locates a shape whose pattern states no path segment on the root catalogue", () => {
		expect(getShapeHref(Part)).toBe("/~#Part");
	});

	it("locates no shape stating no pattern", () => {
		expect(getShapeHref(Bare)).toBeUndefined();
	});

});

describe("getShapeReferrers()", () => {

	it("lists the properties linking to a shape across the model, where they are declared", () => {
		expect(getShapeReferrers(Part, Item)).toEqual([
			{ name: "Item.parts", href: "/things/~#Item" },
			{ name: "Item.either", href: "/things/~#Item" },
			{ name: "Thing.peer", href: "/things/~#Thing" }
		]);
	});

	it("lists properties declared by shapes reached through the model", () => {
		expect(getShapeReferrers(Item, Item)).toEqual([{ name: "Part.item", href: "/~#Part" }]);
	});

	it("lists properties linking to an extended shape", () => {
		expect(getShapeReferrers(Thing, Item)).toEqual([{ name: "Item.owner", href: "/things/~#Item" }]);
	});

	it("lists nothing for a shape no property links to", () => {
		expect(getShapeReferrers(Bare, [Item, Bare])).toEqual([]);
	});

});

describe("tabulate()", () => {

	describe("tables", () => {

		it("describes the shape", () => {
			expect(tabulate(Thing)).toMatchObject({
				name: "Thing",
				class: "https://example.org/terms#Thing",
				parents: []
			});
		});

		it("states the endpoint of the shape as a root-relative pattern", () => {
			expect(tabulate(Thing).endpoint).toBe("/things/{code}");
			expect(tabulate(Part).endpoint).toBe("/");
			expect(tabulate(Bare).endpoint).toBeUndefined();
		});

		it("names the extended shapes", () => {
			expect(tabulate(Item).parents).toEqual([{ name: "Thing", href: "/things/~#Thing" }]);
		});

		it("names a shape stating no English name by its class", () => {
			expect(tabulate(Part).name).toBe("Part");
		});

		it("lists declared properties in declaration order, leaving out hidden ones", () => {
			expect(tabulate(Thing).rows.map(({ term }) => term)).toEqual(["label", "code", "peer"]);
		});

		it("leaves out properties inherited unchanged from shapes resolved apart", () => {
			expect(tabulate(Dataset).rows.map(({ term }) => term)).not.toContain("label");
			expect(tabulate(Dataset).rows.map(({ term }) => term)).not.toContain("dataset");
		});

		it("leaves out unnamed extended shapes", () => {
			expect(tabulate(Item).parents.map(({ name }) => name)).toEqual(["Thing"]);
		});

		it("leaves out inherited properties", () => {
			expect(tabulate(Item).rows.map(({ term }) => term)).toEqual([
				"year", "count", "flags", "parts", "pairs", "some", "either", "owner"
			]);
		});

	});


	describe("rows", () => {

		const rows = () => Object.fromEntries(([Thing, Item]
			.flatMap(shape => tabulate(shape).rows)
			.map(row => [row.term, row])
		));

		it("maps predicates", () => {
			expect(rows().code?.predicate).toBe("https://example.org/terms#code");
			expect(rows().owner?.predicate).toBe("https://example.org/terms#thing");
		});

		it("describes properties", () => {
			expect(rows().label?.description).toBe("The label of the thing.");
			expect(rows().code?.description).toBeUndefined();
		});

		it("types values", () => {
			expect(rows().label?.types).toEqual([{ name: "text", href: undefined }]);
			expect(rows().code?.types).toEqual([{ name: "string", href: undefined }]);
			expect(rows().year?.types).toEqual([{ name: "gYear", href: undefined }]);
			expect(rows().count?.types).toEqual([{ name: "integer", href: undefined }]);
			expect(rows().flags?.types).toEqual([{ name: "boolean", href: undefined }]);
		});

		it("links shape types to their documentation", () => {
			expect(rows().parts?.types).toEqual([{ name: "Part", href: "/~#Part" }]);
		});

		it("lists one type for each alternative", () => {
			expect(rows().either?.types).toEqual([{ name: "string", href: undefined }, { name: "Part", href: "/~#Part" }]);
		});

		it("bounds values", () => {
			expect(rows().year?.cardinality).toBe("1");
			expect(rows().count?.cardinality).toBe("0..1");
			expect(rows().flags?.cardinality).toBe("*");
			expect(rows().parts?.cardinality).toBe("1..*");
			expect(rows().pairs?.cardinality).toBe("2..5");
			expect(rows().some?.cardinality).toBe("2..*");
		});

	});

});
