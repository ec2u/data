/*
 * Copyright © 2025-2026 Metreeca srl
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

import { describe, expect, it } from "vitest";
import { getAcademicYear, getOfferingId } from "./index.js";


const dataset = "https://data.ec2u.eu/offerings/";

const university = "https://data.ec2u.eu/universities/pavia";
const other = "https://data.ec2u.eu/universities/jena";

const key = "500431";
const year = "2025/2026";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getAcademicYear", () => {

	it("starts the academic year in August", async () => {
		expect(getAcademicYear(new Date("2026-08-01T00:00:00Z"))).toBe("2026/2027");
		expect(getAcademicYear(new Date("2026-10-29T12:00:00Z"))).toBe("2026/2027");
		expect(getAcademicYear(new Date("2026-12-31T23:59:59Z"))).toBe("2026/2027");
	});

	it("keeps the academic year until the end of July", async () => {
		expect(getAcademicYear(new Date("2027-01-01T00:00:00Z"))).toBe("2026/2027");
		expect(getAcademicYear(new Date("2027-07-31T23:59:59Z"))).toBe("2026/2027");
	});

	it("names a year a valid offering identity accepts", async () => {
		expect(() => getOfferingId(dataset, university, key, { year: getAcademicYear(new Date()) })).not.toThrow();
	});

});


describe("getOfferingId", () => {

	describe("identity", () => {

		it("names the same offering for the same key and period", async () => {
			expect(getOfferingId(dataset, university, key, { year, term: ["First"] }))
				.toBe(getOfferingId(dataset, university, key, { year, term: ["First"] }));
		});

		it("names the offering as a direct member of the dataset", async () => {
			expect(getOfferingId(dataset, university, key)).toMatch(new RegExp(`^${dataset}[^/]+$`));
		});

		it("names different offerings for different keys", async () => {
			expect(getOfferingId(dataset, university, key)).not.toBe(getOfferingId(dataset, university, `${key}0`));
		});

		it("names different offerings for equal keys at different universities", async () => {
			expect(getOfferingId(dataset, university, key)).not.toBe(getOfferingId(dataset, other, key));
		});

		it("keeps key and period apart, whatever the key holds", async () => {
			expect(getOfferingId(dataset, university, `${key}/${year}`))
				.not.toBe(getOfferingId(dataset, university, key, { year }));
		});

	});

	describe("year", () => {

		it("names different offerings for different years", async () => {
			expect(getOfferingId(dataset, university, key, { year }))
				.not.toBe(getOfferingId(dataset, university, key, { year: "2026/2027" }));
		});

		it("never matches a missing year with a stated one", async () => {
			expect(getOfferingId(dataset, university, key))
				.not.toBe(getOfferingId(dataset, university, key, { year }));
		});

		it("rejects malformed years", async () => {
			expect(() => getOfferingId(dataset, university, key, { year: "2025-26" })).toThrow(RangeError);
			expect(() => getOfferingId(dataset, university, key, { year: "2025" })).toThrow(RangeError);
			expect(() => getOfferingId(dataset, university, key, { year: "" })).toThrow(RangeError);
		});

	});

	describe("term", () => {

		it("names different offerings for different terms", async () => {
			expect(getOfferingId(dataset, university, key, { year, term: ["First"] }))
				.not.toBe(getOfferingId(dataset, university, key, { year, term: ["Second"] }));
		});

		it("never matches missing terms with stated ones", async () => {
			expect(getOfferingId(dataset, university, key, { year }))
				.not.toBe(getOfferingId(dataset, university, key, { year, term: ["Annual"] }));
		});

		it("reads an empty list of terms as no terms", async () => {
			expect(getOfferingId(dataset, university, key, { year, term: [] }))
				.toBe(getOfferingId(dataset, university, key, { year }));
		});

		it("ignores the order and repetition of terms", async () => {
			expect(getOfferingId(dataset, university, key, { term: ["Second", "First", "Second"] }))
				.toBe(getOfferingId(dataset, university, key, { term: ["First", "Second"] }));
		});

	});

	describe("key", () => {

		it("rejects blank keys", async () => {
			expect(() => getOfferingId(dataset, university, "")).toThrow(RangeError);
			expect(() => getOfferingId(dataset, university, " \t\n")).toThrow(RangeError);
		});

	});

});
