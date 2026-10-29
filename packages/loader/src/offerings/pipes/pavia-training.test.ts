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
import { lead } from "./pavia-training.core.js";


const url = "https://portale.unipv.it/it/didattica/post-laurea/master-universitari/offerta-master-e-corsi-di-perfezionamento/ricerca-clinica";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("lead", () => {

	it("seeds an advanced training course", async () => {
		expect(lead({
			url,
			type: "Corso di perfezionamento",
			year: "2026/2027",
			name: "Ricerca Clinica",
			notes: ["Durata Annuale (17 CFU)", "Lingua: Italiana"]
		})).toEqual({
			url,
			seed: {
				kind: "course",
				university: pavia,
				key: url,
				year: "2026/2027",
				name: { it: "Ricerca Clinica" },
				url: [url],
				numberOfCredits: 17,
				inLanguage: ["it"],
				educationalLevel: [getTopicId(isced2011, "7")],
				educationalCredentialAwarded: { credentialCategory: "Certificate" }
			}
		});
	});

	it("reads the languages a course is mainly taught in", async () => {
		expect(lead({
			url, type: "Corso di perfezionamento", name: "Ricerca Clinica", notes: ["Lingua: Prevalentemente Inglese"]
		})?.seed).toMatchObject({ inLanguage: ["en"] });
	});

	it("seeds nothing from other offerings or a blank name", async () => {
		expect(lead({ url, type: "Master 1° livello", name: "MEDEA", notes: [] })).toBeUndefined();
		expect(lead({ url, type: "Corso di perfezionamento", name: " ", notes: [] })).toBeUndefined();
	});

});
