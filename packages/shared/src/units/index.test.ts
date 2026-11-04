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
import { getUnitId, units } from "./index.js";


const university = "https://data.ec2u.eu/universities/pavia";
const other = "https://data.ec2u.eu/universities/jena";

const key = "DIP-INFO";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getUnitId", () => {

	it("names the same unit for the same key", async () => {
		expect(getUnitId(university, key)).toBe(getUnitId(university, key));
	});

	it("names different units for different keys", async () => {
		expect(getUnitId(university, key)).not.toBe(getUnitId(university, `${key}-LAB`));
	});

	it("names different units for equal keys at different universities", async () => {
		expect(getUnitId(university, key)).not.toBe(getUnitId(other, key));
	});

	it("names the unit as a direct member of the units catalogue", async () => {
		expect(getUnitId(university, key)).toMatch(new RegExp(`^${units.id}[^/]+$`));
	});

});
