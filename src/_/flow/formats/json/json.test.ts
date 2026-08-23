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

import type { Value } from "@metreeca/core";
import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { chunks, collect, source, SourceError } from "../index.test.js";
import { json } from "./json.js";


type Item = {

	readonly id: string;
	readonly label: string;

}


/**
 * Creates a counting JSON source reporting an array of items.
 */
function items(count: number) {
	return source(count, index => `${ index > 0 ? "," : "" }{"id":"${ index }","label":"label-${ index }"}`, {
		head: "[",
		tail: "]"
	});
}


describe("json", () => {

	it("reports the parsed document as a single value", async () => {

		const values = json<Item>()(chunks(`{ "id": "1", "label": "alpha" }`));

		expect(await collect(values)).toEqual([
			{ id: "1", label: "alpha" }
		] satisfies readonly Item[]);

	});

	it("joins documents split across chunks", async () => {

		const values = json<Item>()(chunks(`{ "id": "1", `, `"label": "al`, `pha" }`));

		expect(await collect(values)).toEqual([
			{ id: "1", label: "alpha" }
		] satisfies readonly Item[]);

	});

	it("decodes multibyte characters split across byte chunks", async () => {

		const bytes = Buffer.from(`{ "id": "1", "label": "città" }`, "utf8");
		const cut = bytes.indexOf(Buffer.from("à", "utf8")) + 1; // between the two bytes of à

		const values = json<Item>()(chunks(bytes.subarray(0, cut), bytes.subarray(cut)));

		expect(await collect(values)).toEqual([
			{ id: "1", label: "città" }
		] satisfies readonly Item[]);

	});

	it("releases bytes withheld at a boundary where the text resumes", async () => {

		const bytes = Buffer.from(`{ "id": "1", "label": "città`, "utf8");
		const cut = bytes.indexOf(Buffer.from("à", "utf8")) + 1; // between the two bytes of à

		const values = json<Item>()(chunks(bytes.subarray(0, cut), `" }`));

		expect(await collect(values)).toEqual([
			{ id: "1", label: "citt�" }
		] satisfies readonly Item[]);

	});

	it("reports documents rooted at values other than objects", async () => {

		const values = json<Value>()(chunks(`[1, "alpha", null]`));

		expect(await collect(values)).toEqual([
			[1, "alpha", null]
		] satisfies readonly Value[]);

	});

	it("reports no values if the source reports no chunks", async () => {

		const values = json()(chunks());

		expect(await collect(values)).toEqual([]);

	});

	it("reports no values if the source reports only whitespace", async () => {

		const values = json()(chunks(" \n\t "));

		expect(await collect(values)).toEqual([]);

	});

	it("skips documents that cannot be parsed", async () => {

		const values = json()(chunks(`{ "id": "1", `));

		expect(await collect(values)).toEqual([]);

	});

	it("reports source failures", async () => {

		const failing = (async function* () {

			yield `{ "id": "1", `;

			throw new SourceError("broken source");

		})();

		await expect(collect(json()(failing))).rejects.toThrow(SourceError);

	});

	it("drains the source before reporting the value", async () => {

		const count = 1_000;
		const source = items(count);

		const values = json<readonly Item[]>()(source.chunks)[Symbol.asyncIterator]();

		await values.next();

		expect(source.pulled()).toBe(count);

	});

});
