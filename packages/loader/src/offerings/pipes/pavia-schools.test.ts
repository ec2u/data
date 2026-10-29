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
import { school } from "./pavia-schools.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("school", () => {

	it("drafts the school the listing describes", async () => {
		expect(school({
			name: "Cardiochirurgia",
			summary: "Sintesi.",
			contents: "Contenuti.",
			outcomes: "Competenze.",
			prerequisites: "Laurea in Medicina.",
			requirements: "Esame finale."
		})).toEqual({

			kind: "program",

			university: pavia,
			key: "Scuola di Specializzazione in Cardiochirurgia",

			generated: true,

			name: { it: "Scuola di Specializzazione in Cardiochirurgia" },

			disambiguatingDescription: { it: "Sintesi." },
			teaches: { it: "Contenuti." },
			assesses: { it: "Competenze." },
			programPrerequisites: { it: "Laurea in Medicina." },
			competencyRequired: { it: "Esame finale." },

			educationalLevel: [getTopicId(isced2011, "8")],
			educationalCredentialAwarded: {
				credentialCategory: "Degree",
				name: { it: "Diploma di Specializzazione" }
			}

		});
	});

	it("leaves out blank texts", async () => {

		const drafted = school({ name: "Cardiochirurgia", summary: " " });

		expect(drafted).not.toHaveProperty("disambiguatingDescription");
		expect(drafted).not.toHaveProperty("teaches");

	});

	it("drafts nothing from a blank name", async () => {
		expect(school({ name: " " })).toBeUndefined();
	});

});
