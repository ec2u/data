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

import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import { lead } from "./pavia-doctorates.core.js";


const url = "https://phd.unipv.it/comp-mat/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("lead", () => {

	it("seeds a doctorate listed in Italian", async () => {
		expect(lead({ name: "Scienze chimiche e farmaceutiche", language: "it", url })).toEqual({
			url,
			seed: {
				kind: "program",
				university: pavia,
				key: url,
				name: { it: "Dottorato in Scienze chimiche e farmaceutiche" },
				url: [url],
				educationalLevel: [getTopicId(isced2011, "8")],
				educationalCredentialAwarded: { credentialCategory: "Degree", name: { it: "Dottorato di Ricerca" } }
			}
		});
	});

	it("names a doctorate listed in English in English", async () => {
		expect(lead({ name: "Computational Mathematics", language: "en", url })?.seed)
			.toMatchObject({ name: { en: "Doctorate in Computational Mathematics" } });
	});

	it("falls back to Italian for an unknown language", async () => {
		expect(lead({ name: "Fisica", language: "italian", url })?.seed)
			.toMatchObject({ name: { it: "Dottorato in Fisica" } });
	});

	it("seeds nothing from an unusable address or a blank name", async () => {
		expect(lead({ name: "Fisica", language: "it", url: "/comp-mat/" })).toBeUndefined();
		expect(lead({ name: " ", language: "it", url })).toBeUndefined();
	});

});
