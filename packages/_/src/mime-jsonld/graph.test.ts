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
import { boolean } from "@metreeca/blue/boolean";
import { integer, number } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, optional, required, resource, type, type ResourceShape } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { type Lazy } from "@metreeca/core";
import { xsd } from "@metreeca/core/datatype";
import { app, createNamespace } from "@metreeca/core/resource";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { type Graph, named, rdf, tagged, triple, type Triple, typed } from "@metreeca/trio";
import { describe, expect, it } from "vitest";
import { graph } from "./graph.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const ex = createNamespace("https://example.com/");

const subject = named("https://example.com/subject");
const target = named("https://example.com/target");


async function graphs<S extends Lazy<ResourceShape>>(shape: S, ...frames: readonly unknown[]): Promise<readonly Graph[]> {
	return pipe(items(frames)(graph(shape))(toArray()));
}

async function encoded<S extends Lazy<ResourceShape>>(shape: S, ...frames: readonly unknown[]): Promise<readonly Triple[]> {
	return (await graphs(shape, ...frames)).flat();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("encode", () => {

	describe("subjects", () => {

		it("names the resource by its identifier", async () => {

			const shape = resource({ id: id(), value: required(string()) });

			expect(await encoded(shape, { id: subject.iri, value: "x" })).toEqual([
				triple(subject, named(app.value), typed("x", xsd.string))
			]);

		});

		it("names an unidentified resource by a single fresh blank node", async () => {

			const shape = resource({ value: multiple(string()) });

			const triples = await encoded(shape, { value: ["x", "y"] });

			expect(triples).toHaveLength(2);
			expect(triples.map(([s]) => s.kind)).toEqual(["blank", "blank"]);
			expect(triples[0]?.[0]).toEqual(triples[1]?.[0]);

		});

		it("skips descriptions with relative identifiers", async () => {

			const shape = resource({ id: id(), value: required(string()) });

			expect(await encoded(shape, { id: "/subject", value: "x" })).toEqual([]);

		});

	});

	describe("types", () => {

		it("types the resource with its declared and inherited classes", async () => {

			const parent = resource({ class: ex.Parent }, { id: id() });
			const child = resource(parent, { class: ex.Child }, {});

			expect(await encoded(child, { id: subject.iri })).toEqual(expect.arrayContaining([
				triple(subject, named(rdf.type), named(ex.Child)),
				triple(subject, named(rdf.type), named(ex.Parent))
			]));

		});

		it("states the type member value once alongside the declared class", async () => {

			const shape = resource({ class: ex.Kind }, { id: id(), type: type() });

			expect(await encoded(shape, { id: subject.iri, type: ex.Kind })).toEqual([
				triple(subject, named(rdf.type), named(ex.Kind))
			]);

		});

	});

	describe("literals", () => {

		it.each([
			["strings", string(), "x", typed("x", xsd.string)],
			["typed strings", string({ datatype: xsd.date }), "2026-01-01", typed("2026-01-01", xsd.date)],
			["numbers", number(), 1.5, typed(1.5, xsd.double)],
			["typed numbers", integer(), 1, typed(1, xsd.integer)],
			["booleans", boolean(), true, typed(true, xsd.boolean)]
		])("encodes %s with the datatype of the value shape", async (_, range, value, literal) => {

			const shape = resource({ id: id(), value: required(range) });

			expect(await encoded(shape, { id: subject.iri, value })).toEqual([
				triple(subject, named(app.value), literal)
			]);

		});

		it("encodes localised text as tagged literals, plain for the undetermined tag", async () => {

			const shape = resource({ id: id(), value: optional(dictionary()) });

			expect(await encoded(shape, { id: subject.iri, value: { en: ["x"], und: ["y"] }})).toEqual(expect.arrayContaining([
				triple(subject, named(app.value), tagged("x", "en")),
				triple(subject, named(app.value), typed("y", xsd.string))
			]));

		});

		it("encodes union values as the branch they match", async () => {

			const shape = resource({ id: id(), value: multiple(union(string(), integer())) });

			expect(await encoded(shape, { id: subject.iri, value: ["x", 1] })).toEqual(expect.arrayContaining([
				triple(subject, named(app.value), typed("x", xsd.string)),
				triple(subject, named(app.value), typed(1, xsd.integer))
			]));

		});

	});

	describe("properties", () => {

		const linked = resource({ id: id() });

		it("states one statement per value", async () => {

			const shape = resource({ id: id(), value: multiple(string()) });

			expect(await encoded(shape, { id: subject.iri, value: ["x", "y"] })).toEqual(expect.arrayContaining([
				triple(subject, named(app.value), typed("x", xsd.string)),
				triple(subject, named(app.value), typed("y", xsd.string))
			]));

		});

		it("states nothing for absent values", async () => {

			const shape = resource({ id: id(), value: optional(string()) });

			expect(await encoded(shape, { id: subject.iri })).toEqual([]);

		});

		it("maps values under forward predicates", async () => {

			const shape = resource({ id: id(), value: required(string(), { forward: ex.other }) });

			expect(await encoded(shape, { id: subject.iri, value: "x" })).toEqual([
				triple(subject, named(ex.other), typed("x", xsd.string))
			]);

		});

		it("maps values under reverse predicates from the value to the resource", async () => {

			const shape = resource({ id: id(), value: optional(reference(linked), { reverse: ex.owner }) });

			expect(await encoded(shape, { id: subject.iri, value: target.iri })).toEqual([
				triple(target, named(ex.owner), subject)
			]);

		});

		it("leaves out foreign properties", async () => {

			const shape = resource({ id: id(), value: optional(reference(linked), { foreign: true, reverse: ex.owner }) });

			expect(await encoded(shape, { id: subject.iri, value: target.iri })).toEqual([]);

		});

		it("ignores members the shape doesn't declare", async () => {

			const shape = resource({ id: id(), value: optional(string()) });
			const frame = { id: subject.iri, other: "x" };

			expect(await encoded(shape, frame)).toEqual([]);

		});

	});

	describe("resources", () => {

		it("encodes references as named resources", async () => {

			const shape = resource({ id: id(), value: optional(reference(resource({ id: id() }))) });

			expect(await encoded(shape, { id: subject.iri, value: target.iri })).toEqual([
				triple(subject, named(app.value), target)
			]);

		});

		it("skips descriptions embedding identified resources", async () => {

			const shape = resource({ id: id(), value: optional(resource({ id: id(), city: required(string()) })) });

			expect(await encoded(shape, { id: subject.iri, value: { id: target.iri, city: "x" } })).toEqual([]);

		});

		it("describes embedded resources at a fresh blank node", async () => {

			const shape = resource({ id: id(), value: optional(resource({ city: required(string()) })) });

			const triples = await encoded(shape, { id: subject.iri, value: { city: "x" } });
			const link = triples.find(([s]) => s.kind === "named");
			const city = triples.find(([s]) => s.kind === "blank");

			expect(triples).toHaveLength(2);
			expect(link?.[2].kind).toBe("blank");
			expect(city).toEqual([link?.[2], named(app.city), typed("x", xsd.string)]);

		});

	});

	describe("streams", () => {

		it("encodes each description as a graph, in feed order", async () => {

			const shape = resource({ id: id(), value: required(string()) });

			expect(await graphs(shape, { id: subject.iri, value: "x" }, { id: target.iri, value: "y" })).toEqual([
				[triple(subject, named(app.value), typed("x", xsd.string))],
				[triple(target, named(app.value), typed("y", xsd.string))]
			]);

		});

		it("skips descriptions the shape rejects, encoding the others", async () => {

			const shape = resource({ id: id(), value: required(string()) });

			expect(await graphs(shape, { id: subject.iri, value: 1 }, { id: target.iri, value: "y" })).toEqual([
				[triple(target, named(app.value), typed("y", xsd.string))]
			]);

		});

	});

});
