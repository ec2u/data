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
import { getPartner, partners, pavia } from "./index.core.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getPartner", () => {

	it("returns the partner named by its identifier", async () => {
		expect(getPartner(pavia.id)).toBe(pavia);
	});

	it("returns every partner under its own identifier", async () => {
		expect(Object.values(partners).map(partner => getPartner(partner.id)))
			.toEqual(Object.values(partners));
	});

	it("rejects identifiers naming no partner", async () => {
		expect(() => getPartner("https://data.ec2u.eu/universities/unknown")).toThrow("unknown university");
	});

});
