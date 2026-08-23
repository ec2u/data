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
import { json } from "./json.js";


type Item = {

	readonly id: string;
	readonly label: string;

}


/**
 * Creates a source reporting the given chunks.
 */
async function* chunks(...values: readonly (string | Uint8Array)[]): AsyncIterable<string | Uint8Array> {
	yield* values;
}

/**
 * Drains a stream into an array.
 *
 * Hand-rolled rather than delegating to `Array.fromAsync()`, which the `ES2022` library the project compiles against
 * doesn't provide.
 */
async function collect<V>(items: AsyncIterable<V>): Promise<readonly V[]> {

	const collected: V[] = [];

	for await ( const item of items ) { collected.push(item) } // draining a stream has no functional equivalent

	return collected;

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

	it("skips documents whose byte sequences are left truncated by a switch to text", async () => {

		const bytes = Buffer.from(`{ "id": "1", "label": "città`, "utf8");
		const cut = bytes.indexOf(Buffer.from("à", "utf8")) + 1; // between the two bytes of à

		// the withheld bytes are released at the end of the source rather than where the text resumes, so the
		// replacement character trails the document rather than standing in for the truncated sequence

		const values = json<Item>()(chunks(bytes.subarray(0, cut), `" }`));

		expect(await collect(values)).toEqual([]);

	});

	it("decodes multibyte characters split across byte chunks resuming after text chunks", async () => {

		const bytes = Buffer.from(`città" }`, "utf8");
		const cut = bytes.indexOf(Buffer.from("à", "utf8")) + 1; // between the two bytes of à

		const values = json<Item>()(chunks(`{ "id": "1", "label": "`, bytes.subarray(0, cut), bytes.subarray(cut)));

		expect(await collect(values)).toEqual([
			{ id: "1", label: "città" }
		] satisfies readonly Item[]);

	});

	it("reports documents rooted at values other than objects", async () => {

		const values = json<Value>()(chunks(`[1, "alpha", null]`));

		expect(await collect(values)).toEqual([
			[1, "alpha", null]
		] satisfies readonly Value[]);

	});

	it("reports documents rooted at scalar values", async () => {

		const values = json<Value>()(chunks(`42`));

		expect(await collect(values)).toEqual([
			42
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

			throw new Error("broken source"); // told apart from failures reported by the task by its message

		})();

		await expect(collect(json()(failing))).rejects.toThrow("broken source");

	});

	it("drains the source before reporting the value", async () => {

		const count = 1_000;
		const state = { pulled: 0 }; // records how far the task pulls the source

		async function* items(): AsyncIterable<string> {

			yield "[";

			for ( const index of Array.from({ length: count }, (_, i) => i) ) { // generators have no functional equivalent

				state.pulled=index+1;

				yield `${ index > 0 ? "," : "" }{"id":"${ index }","label":"label-${ index }"}`;

			}

			yield "]";

		}

		const values = json<readonly Item[]>()(items())[Symbol.asyncIterator]();

		await values.next();

		expect(state.pulled).toBe(count);

	});

});
