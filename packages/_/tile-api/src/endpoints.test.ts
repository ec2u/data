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


import { resource } from "@metreeca/blue/resource";
import { describe, expect, it } from "vitest";
import {
	type Endpoints,
	getContainers,
	getEndpointAnchor,
	getEndpointDepth,
	getShapeEndpoints,
	overlaps
} from "./endpoints.core.js";


const Root = resource({ name: "Root" }, {});
const Items = resource({ name: "Items" }, {});
const Item = resource({ name: "Item", pattern: "https://example.org/items/{code}" }, {});
const Taxonomies = resource({ name: "Taxonomies" }, {});
const Taxonomy = resource({ name: "Taxonomy" }, {});
const Concept = resource({ name: "Concept", pattern: "https://example.org/taxonomies/*" }, {});

const endpoints: Endpoints = {
	"/": Root,
	"/items/": Items,
	"/items/:code": Item,
	"/taxonomies/": Taxonomies,
	"/taxonomies/:taxonomy": Taxonomy,
	"/taxonomies/:taxonomy/*concept": Concept
};


describe("getShapeEndpoints()", () => {

	it("lists the routes mounted for a shape", async () => {
		expect(getShapeEndpoints(endpoints, Items)).toEqual(["/items/"]);
		expect(getShapeEndpoints(endpoints, Item)).toEqual(["/items/:code"]);
		expect(getShapeEndpoints(endpoints, Concept)).toEqual(["/taxonomies/:taxonomy/*concept"]);
	});

	it("lists the routes mounted for an extended shape whose paths match the identifier pattern", async () => {

		const Special = resource(Concept, {
			name: "Special Concept",
			pattern: "https://example.org/taxonomies/special/*"
		});

		expect(getShapeEndpoints(endpoints, Special)).toEqual(["/taxonomies/:taxonomy/*concept"]);

	});

	it("lists no route for shapes no route serves", async () => {
		expect(getShapeEndpoints(endpoints, resource({ name: "Stray" }, {}))).toEqual([]);
	});

});

describe("getContainers()", () => {

	it("lists the shapes served at container routes, the root included", async () => {

		const containers = getContainers(endpoints);

		expect(containers).toContain(Root);
		expect(containers).toContain(Items);
		expect(containers).not.toContain(Item);

	});

});

describe("getEndpointDepth()", () => {

	it("places the root route at the top", async () => {
		expect(getEndpointDepth(endpoints, "/")).toBe(0);
	});

	it("nests routes under the routes their paths extend", async () => {
		expect(getEndpointDepth(endpoints, "/items/")).toBe(1);
		expect(getEndpointDepth(endpoints, "/items/:code")).toBe(2);
		expect(getEndpointDepth(endpoints, "/taxonomies/:taxonomy")).toBe(2);
		expect(getEndpointDepth(endpoints, "/taxonomies/:taxonomy/*concept")).toBe(3);
	});

	it("matches whole path segments only", async () => {
		expect(getEndpointDepth(endpoints, "/taxonomies/:taxonomyset")).toBe(2);
	});

});

describe("getEndpointAnchor()", () => {

	it("names anchors after the route path", async () => {
		expect(getEndpointAnchor("/universities/:code")).toBe("route-universities-code");
		expect(getEndpointAnchor("/taxonomies/:taxonomy/*concept")).toBe("route-taxonomies-taxonomy-concept");
	});

	it("names the anchor of the root route", async () => {
		expect(getEndpointAnchor("/")).toBe("route");
	});

});

describe("overlaps()", () => {

	describe("literal segments", () => {

		it("matches equal paths", async () => {
			expect(overlaps("/universities/", "/universities/")).toBe(true);
		});

		it("rejects different paths", async () => {
			expect(overlaps("/universities/", "/units/")).toBe(false);
		});

		it("rejects paths of different length", async () => {
			expect(overlaps("/taxonomies/isced", "/taxonomies/isced/levels")).toBe(false);
		});

	});

	describe("single-segment placeholders", () => {

		it("matches placeholders against literal segments", async () => {
			expect(overlaps("/taxonomies/{taxonomy}", "/taxonomies/isced")).toBe(true);
			expect(overlaps("/taxonomies/isced", "/taxonomies/:taxonomy")).toBe(true);
		});

		it("matches placeholders against each other", async () => {
			expect(overlaps("/taxonomies/{taxonomy}", "/taxonomies/:taxonomy")).toBe(true);
		});

		it("keeps containers apart from their items", async () => {
			expect(overlaps("/taxonomies/", "/taxonomies/:taxonomy")).toBe(false);
			expect(overlaps("/taxonomies/{taxonomy}", "/taxonomies/")).toBe(false);
		});

	});

	describe("trailing wildcards", () => {

		it("matches one or more trailing segments", async () => {
			expect(overlaps("/taxonomies/*", "/taxonomies/:taxonomy")).toBe(true);
			expect(overlaps("/taxonomies/*", "/taxonomies/:taxonomy/*concept")).toBe(true);
		});

		it("requires at least one trailing segment", async () => {
			expect(overlaps("/taxonomies/*", "/taxonomies/")).toBe(false);
			expect(overlaps("/taxonomies/isced", "/taxonomies/isced/*concept")).toBe(false);
		});

		it("matches fixed prefixes against placeholders", async () => {
			expect(overlaps("/taxonomies/euroscivoc/*", "/taxonomies/:taxonomy/*concept")).toBe(true);
			expect(overlaps("/taxonomies/euroscivoc/*", "/taxonomies/:taxonomy")).toBe(false);
		});

		it("rejects different fixed prefixes", async () => {
			expect(overlaps("/taxonomies/euroscivoc/*", "/events/*event")).toBe(false);
		});

	});

	describe("absolute patterns", () => {

		it("matches absolute patterns on their path alone", async () => {
			expect(overlaps("https://example.org/taxonomies/{taxonomy}", "/taxonomies/:taxonomy")).toBe(true);
			expect(overlaps("https://example.org/taxonomies/", "/taxonomies/:taxonomy")).toBe(false);
		});

	});

});
