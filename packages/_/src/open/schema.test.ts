/*
 * Copyright © 2013-2026 Metreeca srl
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

import { blank, graph, named, tagged, triple, typed } from "@metreeca/trio";
import { describe, expect, it } from "vitest";
import { Schema, schema } from "./schema.js";


describe("schema", () => {

	it("should resolve terms in the canonical namespace", async () => {
		expect(schema[""]).toBe("https://schema.org/");
		expect(schema.Event).toBe("https://schema.org/Event");
	});

});

describe("Schema.legacy", () => {

	it("should resolve terms in the legacy namespace", async () => {
		expect(Schema.legacy[""]).toBe("http://schema.org/");
		expect(Schema.legacy.Event).toBe("http://schema.org/Event");
	});

});

describe("Schema.normalize()", () => {

	describe("named resources", () => {

		it("should upgrade legacy terms", async () => {
			expect(Schema.normalize(named("http://schema.org/Event"))).toEqual(named("https://schema.org/Event"));
			expect(Schema.normalize(named("http://schema.org/name"))).toEqual(named("https://schema.org/name"));
		});

		it("should upgrade the legacy namespace itself", async () => {
			expect(Schema.normalize(named("http://schema.org/"))).toEqual(named("https://schema.org/"));
		});

		it("should preserve canonical terms", async () => {
			expect(Schema.normalize(named("https://schema.org/Event"))).toEqual(named("https://schema.org/Event"));
		});

		it("should preserve terms of other namespaces", async () => {
			expect(Schema.normalize(named("https://example.org/Event"))).toEqual(named("https://example.org/Event"));
			expect(Schema.normalize(named("http://schema.org.example/Event"))).toEqual(named("http://schema.org.example/Event"));
		});

		it("should preserve nested legacy resources", async () => {
			expect(Schema.normalize(named("http://schema.org/docs/Event"))).toEqual(named("http://schema.org/docs/Event"));
			expect(Schema.normalize(named("http://schema.org/Event#x"))).toEqual(named("http://schema.org/Event#x"));
		});

	});

	describe("other terms", () => {

		it("should preserve blank nodes", async () => {
			expect(Schema.normalize(blank("x"))).toEqual(blank("x"));
		});

		it("should preserve tagged literals", async () => {
			expect(Schema.normalize(tagged("http://schema.org/Event", "en"))).toEqual(tagged("http://schema.org/Event", "en"));
		});

		it("should preserve typed literals and their datatypes", async () => {
			expect(Schema.normalize(typed("http://schema.org/Event"))).toEqual(typed("http://schema.org/Event"));
			expect(Schema.normalize(typed("1", "http://schema.org/Number"))).toEqual(typed("1", "http://schema.org/Number"));
		});

	});

	describe("triples", () => {

		it("should upgrade subject, predicate and object", async () => {
			expect(Schema.normalize(triple(
				named("http://schema.org/Event"),
				named("http://schema.org/sameAs"),
				named("http://schema.org/Thing")
			))).toEqual(triple(
				named("https://schema.org/Event"),
				named("https://schema.org/sameAs"),
				named("https://schema.org/Thing")
			));
		});

		it("should preserve terms other than legacy named resources", async () => {
			expect(Schema.normalize(triple(
				blank("x"),
				named("http://schema.org/name"),
				tagged("Open Day", "en")
			))).toEqual(triple(
				blank("x"),
				named("https://schema.org/name"),
				tagged("Open Day", "en")
			));
		});

	});

	describe("graphs", () => {

		it("should upgrade every triple", async () => {
			expect(Schema.normalize(graph(
				triple(named("https://example.org/e"), named("http://schema.org/name"), tagged("Open Day", "en")),
				triple(named("https://example.org/e"), named("https://example.org/p"), named("http://schema.org/Event"))
			))).toEqual(graph(
				triple(named("https://example.org/e"), named("https://schema.org/name"), tagged("Open Day", "en")),
				triple(named("https://example.org/e"), named("https://example.org/p"), named("https://schema.org/Event"))
			));
		});

		it("should normalize empty graphs", async () => {
			expect(Schema.normalize(graph())).toEqual(graph());
		});

	});

});
