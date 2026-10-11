/*
 * Copyright © 2026 Metreeca srl. All rights reserved.
 */

import { dictionary } from "@metreeca/blue/dictionary";
import { boolean } from "@metreeca/blue/boolean";
import { integer, number } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, optional, required, resource, type } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { createNamespace } from "@metreeca/core/resource";
import { describe, expect, it } from "vitest";
import { getStateEntries, getStateId } from "./resource.js";


const ex = createNamespace("https://example.com/");

const subject = "https://example.com/subject";
const target = "https://example.com/target";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getStateId", () => {

	it("retrieves the identifier the state states", async () => {

		const shape = resource({ id: id() });

		expect(getStateId(shape, { id: subject })).toBe(subject);

	});

	it("retrieves nothing where the shape declares no id member", async () => {

		const shape = resource({ value: optional(string()) });

		expect(getStateId(shape, { value: "x" })).toBeUndefined();

	});

});

describe("getStateEntries", () => {

	it.each([
		["boolean", boolean(), true],
		["number", number(), 1.5],
		["string", string(), "x"],
		["dictionary", dictionary(), { en: ["x"] }],
		["reference", reference(resource({ id: id() })), target],
		["resource", resource({ value: optional(string()) }), { value: "x" }]
	])("pairs %s values with their member and value shape", async (kind, range, value) => {

		const shape = resource({ id: id(), value: required(range) });

		expect(getStateEntries(shape, { id: subject, value })).toEqual([
			expect.objectContaining({ kind, shape: range, field: "value", value })
		]);

	});

	it("carries the property each value is held by", async () => {

		const shape = resource({ value: optional(string(), { forward: ex.other }) });

		expect(getStateEntries(shape, { value: "x" })[0]?.property.forward).toBe(ex.other);

	});

	it("resolves union values to the branch they match", async () => {

		const text = string();
		const count = integer();

		const shape = resource({ value: multiple(union(text, count)) });

		expect(getStateEntries(shape, { value: ["x", 1] })).toEqual([
			expect.objectContaining({ kind: "string", shape: text, value: "x" }),
			expect.objectContaining({ kind: "number", shape: count, value: 1 })
		]);

	});

	it("yields one entry per value, in value order", async () => {

		const shape = resource({ value: multiple(string()) });

		expect(getStateEntries(shape, { value: ["x", "y"] }).map(entry => entry.value)).toEqual(["x", "y"]);

	});

	it("yields entries in member declaration order", async () => {

		const shape = resource({ a: optional(string()), b: optional(integer()) });

		expect(getStateEntries(shape, { b: 1, a: "x" }).map(entry => entry.field)).toEqual(["a", "b"]);

	});

	it.each([
		["absent values", {}],
		["empty value lists", { value: [] }]
	])("yields nothing for %s", async (_, state) => {

		const shape = resource({ value: multiple(string()) });

		expect(getStateEntries(shape, state)).toEqual([]);

	});

	it("keeps foreign properties", async () => {

		const shape = resource({ value: optional(reference(resource({ id: id() })), { foreign: true, reverse: ex.owner }) });

		expect(getStateEntries(shape, { value: target })).toEqual([
			expect.objectContaining({ kind: "reference", value: target })
		]);

	});

	it("skips id and type members", async () => {

		const shape = resource({ class: ex.Kind }, { id: id(), type: type() });

		expect(getStateEntries(shape, { id: subject, type: ex.Kind })).toEqual([]);

	});

	it("ignores members the shape doesn't declare", async () => {

		const shape = resource({ value: optional(string()) });
		const state = { value: "x", other: "y" };

		expect(getStateEntries(shape, state).map(entry => entry.field)).toEqual(["value"]);

	});

});
