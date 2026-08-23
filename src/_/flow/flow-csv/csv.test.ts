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

import { Buffer } from "node:buffer";
import { setTimeout as delay } from "node:timers/promises";
import { describe, expect, it } from "vitest";
import { chunks, collect, source, SourceError } from "../flow/index.test.js";
import { csv } from "./csv.js";


type Row = {

	readonly id: string;
	readonly label: string;

}


/**
 * Creates a counting CSV source reporting a header and data rows.
 */
function rows(count: number) {
	return source(count, index => `${ index },label-${ index }\n`, { head: "id,label\n" });
}


describe("csv", () => {

	it("yields a record for each data row", async () => {

		const records = csv<Row>({ header: true })(chunks("id,label\n1,alpha\n2,beta\n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha" },
			{ id: "2", label: "beta" }
		] satisfies readonly Row[]);

	});

	it("joins records split across chunks", async () => {

		const records = csv<Row>({ header: true })(chunks("id,la", "bel\n1,al", "pha\n2,beta\n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha" },
			{ id: "2", label: "beta" }
		] satisfies readonly Row[]);

	});

	it("decodes multibyte characters split across byte chunks", async () => {

		const bytes = Buffer.from("id,label\n1,città\n", "utf8");
		const cut = bytes.indexOf(Buffer.from("à", "utf8")) + 1; // between the two bytes of à

		const records = csv<Row>({ header: true })(chunks(bytes.subarray(0, cut), bytes.subarray(cut)));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "città" }
		] satisfies readonly Row[]);

	});

	it("splits fields on a configured delimiter", async () => {

		const records = csv<Row>({ header: true, delimiter: ";" })(chunks("id;label\n1;alpha\n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha" }
		] satisfies readonly Row[]);

	});

	it("unwraps fields with a configured quote", async () => {

		const records = csv<Row>({ header: true, quote: "'" })(chunks("id,label\n1,'alpha,beta'\n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha,beta" }
		] satisfies readonly Row[]);

	});

	it("falls back to the default delimiter and quote if configured as empty", async () => {

		const records = csv<Row>({ header: true, delimiter: "", quote: "" })(chunks("id,label\n1,\"alpha,beta\"\n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha,beta" }
		] satisfies readonly Row[]);

	});

	it("trims field whitespace on request", async () => {

		const records = csv<Row>({ header: true, trim: true })(chunks(" id , label \n 1 , alpha \n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha" }
		] satisfies readonly Row[]);

	});

	it("skips empty lines on request", async () => {

		const records = csv<Row>({ header: true, skip: true })(chunks("id,label\n1,alpha\n\n2,beta\n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha" },
			{ id: "2", label: "beta" }
		] satisfies readonly Row[]);

	});

	it("skips records with mismatched field counts", async () => {

		const records = csv<Row>({ header: true })(chunks("id,label\n1\n2,beta,extra\n3,gamma\n"));

		expect(await collect(records)).toEqual([
			{ id: "3", label: "gamma" }
		] satisfies readonly Row[]);

	});

	it("reports short records without their missing fields on request", async () => {

		const records = csv<Row>({ header: true, flex: true })(chunks("id,label\n1\n2,beta\n"));

		expect(await collect(records)).toEqual([
			{ id: "1" },
			{ id: "2", label: "beta" }
		] satisfies readonly Partial<Row>[]);

	});

	it("discards fields beyond the header on request", async () => {

		const records = csv<Row>({ header: true, flex: true })(chunks("id,label\n1,alpha,extra\n"));

		expect(await collect(records)).toEqual([
			{ id: "1", label: "alpha" }
		] satisfies readonly Row[]);

	});

	it("skips records that cannot be parsed", async () => {

		const records = csv<Row>({ header: true })(chunks("id,label\n1,\"alpha\"x\n"));

		expect(await collect(records)).toEqual([]);

	});

	it("reports source failures", async () => {

		const failing = (async function* () {

			yield "id,label\n";

			throw new SourceError("broken source");

		})();

		await expect(collect(csv({ header: true })(failing))).rejects.toThrow(SourceError);

	});

	it("pulls from the source as records are consumed", async () => {

		const count = 10_000;
		const source = rows(count);

		const records = csv({ header: true })(source.chunks)[Symbol.asyncIterator]();

		await records.next();

		expect(source.pulled()).toBeLessThan(count / 2);

	});

	it("releases the source when the consumer stops early", async () => {

		const source = rows(10_000);

		const records = csv({ header: true })(source.chunks)[Symbol.asyncIterator]();

		await records.next();
		await records.return?.(); // as a downstream take() would, once satisfied

		await delay(10); // teardown propagates upstream asynchronously

		expect(source.closed()).toBeTruthy();

	});

});
