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
import { lead } from "./pavia-schools.core.js";


const url = "https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/cardiochirurgia-0";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("lead", () => {

	it("seeds the school the catalogue lists", async () => {
		expect(lead({ url, type: "Laureati medici", name: "Cardiochirurgia", notes: ["Durata 5 anni"] })).toEqual({
			url,
			seed: {
				kind: "program",
				university: pavia,
				key: url,
				name: { it: "Scuola di Specializzazione in Cardiochirurgia" },
				url: [url],
				timeToComplete: "P5Y",
				educationalLevel: [getTopicId(isced2011, "8")],
				educationalCredentialAwarded: {
					credentialCategory: "Degree",
					name: { it: "Diploma di Specializzazione" }
				}
			}
		});
	});

	it("names schools listed in capitals in sentence case", async () => {
		expect(lead({ url, type: "Laureati medici", name: "MALATTIE DELL'APPARATO DIGERENTE", notes: [] })?.seed)
			.toMatchObject({ name: { it: "Scuola di Specializzazione in Malattie dell'apparato digerente" } });
	});

	it("leaves out an unstated duration", async () => {
		expect(lead({ url, type: "Laureati medici", name: "Cardiochirurgia", notes: [] })?.seed)
			.not.toHaveProperty("timeToComplete");
	});

	it("seeds nothing from a blank name", async () => {
		expect(lead({ url, type: "Laureati medici", name: " ", notes: [] })).toBeUndefined();
	});

});
