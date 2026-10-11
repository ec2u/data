/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

import { reference } from "@metreeca/blue/reference";
import { getShapeClass, id, optional, required, resource, type ResourceShape } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { createNamespace } from "@metreeca/core/resource";
import { describe, expect, it } from "vitest";
import { model } from "./model.js";


const ex = createNamespace("https://example.com/");


/**
 * Lists the classes of a set of shapes, so that expectations name shapes by class rather than by identity.
 */
function classes(shapes: readonly ResourceShape[]) {
	return shapes.map(getShapeClass);
}


describe("model", () => {

	describe("entry shapes", () => {

		it("lists nothing for no shapes", async () => {

			expect(model([])).toEqual([]);

		});

		it("lists a shape reaching no other", async () => {

			expect(classes(model(resource({ class: ex.Kind }, { id: id() })))).toEqual([ex.Kind]);

		});

		it("lists the entry shapes first, in the order given", async () => {

			const one = resource({ class: ex.One }, { id: id() });
			const two = resource({ class: ex.Two }, { id: id(), link: optional(reference(one)) });

			expect(classes(model([two, one]))).toEqual([ex.Two, ex.One]);

		});

		it("resolves deferred shapes", async () => {

			expect(classes(model(() => resource({ class: ex.Kind }, { id: id() })))).toEqual([ex.Kind]);

		});

		it("lists repeated entry shapes once", async () => {

			const shape = resource({ class: ex.Kind }, { id: id() });

			expect(classes(model([shape, shape]))).toEqual([ex.Kind]);

		});

	});

	describe("reachable shapes", () => {

		it("lists the shapes extended, transitively", async () => {

			const grandparent = resource({ class: ex.Grandparent }, { id: id() });
			const parent = resource(grandparent, { class: ex.Parent }, {});
			const child = resource(parent, { class: ex.Child }, {});

			expect(classes(model(child))).toEqual([ex.Child, ex.Parent, ex.Grandparent]);

		});

		it("lists linked shapes", async () => {

			const target = resource({ class: ex.Target }, { id: id(), value: required(string()) });
			const shape = resource({ class: ex.Kind }, { id: id(), link: optional(reference(target)) });

			expect(classes(model(shape))).toEqual([ex.Kind, ex.Target]);

		});

		it("lists embedded shapes", async () => {

			const shape = resource({ class: ex.Kind }, {
				id: id(),
				part: optional(resource({ class: ex.Part }, { value: required(string()) }))
			});

			expect(classes(model(shape))).toEqual([ex.Kind, ex.Part]);

		});

		it("lists shapes linked by foreign properties", async () => {

			const linked = resource({ class: ex.Linked }, { id: id() });

			const shape = resource({ class: ex.Kind }, {
				id: id(),
				value: optional(reference(linked), { foreign: true, reverse: ex.owner })
			});

			expect(classes(model(shape))).toEqual([ex.Kind, ex.Linked]);

		});

		it("lists the alternatives of unions", async () => {

			const one = resource({ class: ex.One }, { id: id() });
			const two = resource({ class: ex.Two }, { id: id() });

			const shape = resource({ class: ex.Kind }, { id: id(), value: optional(union(reference(one), reference(two))) });

			expect(classes(model(shape))).toEqual([ex.Kind, ex.One, ex.Two]);

		});

		it("lists the nearest shapes first", async () => {

			const far = resource({ class: ex.Far }, { id: id() });
			const near = resource({ class: ex.Near }, { id: id(), link: optional(reference(far)) });
			const other = resource({ class: ex.Other }, { id: id() });

			const shape = resource({ class: ex.Kind }, {
				id: id(),
				near: optional(reference(near)),
				other: optional(reference(other))
			});

			expect(classes(model(shape))).toEqual([ex.Kind, ex.Near, ex.Other, ex.Far]);

		});

		it("lists parents before property targets, and properties in declaration order", async () => {

			const parent = resource({ class: ex.Parent }, { id: id() });
			const one = resource({ class: ex.One }, { id: id() });
			const two = resource({ class: ex.Two }, { id: id() });

			const shape = resource(parent, { class: ex.Kind }, {
				two: optional(reference(two)),
				one: optional(reference(one))
			});

			expect(classes(model(shape))).toEqual([ex.Kind, ex.Parent, ex.Two, ex.One]);

		});

		it("lists shapes layer by layer across entry shapes", async () => {

			const deep = resource({ class: ex.Deep }, { id: id() });
			const one = resource({ class: ex.One }, { id: id(), link: optional(reference(deep)) });
			const two = resource({ class: ex.Two }, { id: id() });

			const first = resource({ class: ex.First }, { id: id(), link: optional(reference(one)) });
			const second = resource({ class: ex.Second }, { id: id(), link: optional(reference(two)) });

			expect(classes(model([first, second]))).toEqual([ex.First, ex.Second, ex.One, ex.Two, ex.Deep]);

		});

		it("lists an entry shape in the first layer, even if reached from another entry shape", async () => {

			const target = resource({ class: ex.Target }, { id: id() });
			const shape = resource({ class: ex.Kind }, { id: id(), link: optional(reference(target)) });
			const other = resource({ class: ex.Other }, { id: id() });

			expect(classes(model([shape, other, target]))).toEqual([ex.Kind, ex.Other, ex.Target]);

		});

		it("lists shapes linking each other once", async () => {

			function Head() {
				return resource({ class: ex.Head }, { id: id(), tail: optional(reference(Tail)) });
			}

			function Tail() {
				return resource({ class: ex.Tail }, { id: id(), head: optional(reference(Head)) });
			}

			expect(classes(model(Head))).toEqual([ex.Head, ex.Tail]);

		});

	});

});
