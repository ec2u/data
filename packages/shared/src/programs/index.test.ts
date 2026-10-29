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
import { getProgramId, programs } from "./index.js";


const university = "https://data.ec2u.eu/universities/pavia";

const key = "05201";
const year = "2025/2026";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getProgramId", () => {

	it("names the program as a direct member of the programs catalogue", async () => {
		expect(getProgramId(university, key)).toMatch(new RegExp(`^${programs.id}[^/]+$`));
	});

	it("names the program as the offering delivered in the same year", async () => {
		expect(getProgramId(university, key, { year })).toBe(getOfferingId(programs.id, university, key, { year }));
	});

});
