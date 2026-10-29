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
import { getOfferingId } from "../offerings/index.js";
import { getProgramId } from "../programs/index.js";
import { courses, getCourseId } from "./index.js";


const university = "https://data.ec2u.eu/universities/pavia";

const key = "500431";
const year = "2025/2026";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getCourseId", () => {

	it("names the course as a direct member of the courses catalogue", async () => {
		expect(getCourseId(university, key)).toMatch(new RegExp(`^${courses.id}[^/]+$`));
	});

	it("names the course as the offering delivered in the same year and terms", async () => {
		expect(getCourseId(university, key, { year, term: ["First"] }))
			.toBe(getOfferingId(courses.id, university, key, { year, term: ["First"] }));
	});

	it("never names a program sharing its key and year", async () => {
		expect(getCourseId(university, key, { year })).not.toBe(getProgramId(university, key, { year }));
	});

});
