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
import { lead } from "./pavia-masters.core.js";


const url = "https://portale.unipv.it/it/didattica/post-laurea/master-universitari/offerta-master-e-corsi-di-perfezionamento/medea";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("lead", () => {

	it("seeds a first level master", async () => {
		expect(lead({
			url,
			type: "Master 1° livello",
			year: "2026/2027",
			name: "Energy and Environmental Management and Economics – MEDEA",
			notes: ["Durata Annuale (60 CFU)", "Lingua: Inglese"]
		})).toEqual({
			url,
			seed: {
				kind: "program",
				university: pavia,
				key: url,
				year: "2026/2027",
				name: { it: "Energy and Environmental Management and Economics – MEDEA" },
				url: [url],
				numberOfCredits: 60,
				timeToComplete: "P1Y",
				educationalLevel: [getTopicId(isced2011, "7")],
				educationalCredentialAwarded: {
					credentialCategory: "Degree",
					name: { it: "Master universitario di primo livello" }
				}
			}
		});
	});

	it("seeds a second level master", async () => {
		expect(lead({ url, type: "Master 2° livello", name: "Cure palliative", notes: [] })?.seed).toMatchObject({
			educationalCredentialAwarded: { name: { it: "Master universitario di secondo livello" } }
		});
	});

	it("seeds nothing from other offerings or a blank name", async () => {
		expect(lead({ url, type: "Corso di perfezionamento", name: "Ricerca Clinica", notes: [] })).toBeUndefined();
		expect(lead({ url, type: "Master 1° livello", name: " ", notes: [] })).toBeUndefined();
	});

});
