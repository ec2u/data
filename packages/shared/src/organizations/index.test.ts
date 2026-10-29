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
import { getOrganizationId, organizations } from "./index.js";


const university = "https://data.ec2u.eu/universities/pavia";
const source = "https://data.ec2u.eu/offerings/pavia";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getOrganizationId", () => {

	it("names the same organisation within the same source, regardless of case", async () => {
		expect(getOrganizationId(university, "Dipartimento di Fisica", source))
			.toBe(getOrganizationId(university, "DIPARTIMENTO DI FISICA", source));
	});

	it("names an organisation owned by a source apart from the shared one", async () => {
		expect(getOrganizationId(university, "Dipartimento di Fisica", source))
			.not.toBe(getOrganizationId(university, "Dipartimento di Fisica"));
	});

	it("names an organisation apart in different sources and universities", async () => {
		expect(getOrganizationId(university, "Fisica", source))
			.not.toBe(getOrganizationId(university, "Fisica", "https://data.ec2u.eu/offerings/lll"));
		expect(getOrganizationId(university, "Fisica", source))
			.not.toBe(getOrganizationId("https://data.ec2u.eu/universities/jena", "Fisica", source));
	});

	it("names the organisation as a direct member of the organisations catalogue", async () => {
		expect(getOrganizationId(university, "Fisica", source)).toMatch(new RegExp(`^${organizations.id}[^/]+$`));
	});

});
