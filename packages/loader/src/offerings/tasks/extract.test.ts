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
import { umea } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import type { CourseDraft, ProgramDraft } from "../sinks/sync.js";
import { drafted, type Reported } from "./extract.js";


const url = "https://www.umu.se/utbildning/program/datavetenskap/";

const program: ProgramDraft = { kind: "program", university: umea, key: url, name: {} };
const course: CourseDraft = { kind: "course", university: umea, key: url, name: {} };

const reported: Reported = {
	language: "sv",
	name: "Datavetenskap",
	description: "Beskrivning.",
	summary: "Sammanfattning.",
	contents: "Innehåll.",
	outcomes: "Resultat.",
	requirements: "Examination.",
	prerequisites: "Behörighet.",
	credits: 180,
	educationalCredential: "Kandidatexamen",
	level: 6,
	duration: "P3Y",
	workload: "PT40H",
	code: "5DV001",
	teaching: "en",
	fees: "free",
	mode: "online"
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("drafted", () => {

	describe("program", () => {

		it("reads the facts the page states in its language", async () => {
			expect(drafted(program, url, reported)).toEqual({

				kind: "program",
				university: umea,
				key: url,

				name: { sv: "Datavetenskap" },
				url: [url],

				description: { sv: "Beskrivning." },
				disambiguatingDescription: { sv: "Sammanfattning." },
				teaches: { sv: "Innehåll." },
				assesses: { sv: "Resultat." },
				competencyRequired: { sv: "Examination." },
				programPrerequisites: { sv: "Behörighet." },

				numberOfCredits: 180,
				timeToComplete: "P3Y",
				educationalLevel: [getTopicId(isced2011, "6")],
				educationalCredentialAwarded: { credentialCategory: "Degree", name: { sv: "Kandidatexamen" } }

			});
		});

		it("keeps the facts the seed states", async () => {
			expect(drafted({
				...program,
				name: { it: "Dottorato in Fisica" },
				url: ["https://phd.unipv.it/fisica/"],
				educationalLevel: [getTopicId(isced2011, "8")]
			}, url, reported)).toMatchObject({
				name: { it: "Dottorato in Fisica" },
				url: ["https://phd.unipv.it/fisica/"],
				educationalLevel: [getTopicId(isced2011, "8")]
			});
		});

		it("falls back to the local language of the university", async () => {
			expect(drafted(program, url, { ...reported, language: "swedish" })).toMatchObject({
				name: { sv: "Datavetenskap" }
			});
		});

		it("leaves out blank texts and missing facts", async () => {

			const read = drafted(program, url, { language: "sv", name: "Datavetenskap", description: " " });

			expect(read).not.toHaveProperty("description");
			expect(read).not.toHaveProperty("numberOfCredits");
			expect(read).not.toHaveProperty("educationalCredentialAwarded");
			expect(read).toMatchObject({ educationalLevel: [] });

		});

		it("states no course facts for a program", async () => {

			const read = drafted(program, url, reported);

			expect(read).not.toHaveProperty("courseCode");
			expect(read).not.toHaveProperty("courseMode");
			expect(read).not.toHaveProperty("timeRequired");

		});

	});

	describe("course", () => {

		it("reads the course facts the page states", async () => {
			expect(drafted(course, url, reported)).toMatchObject({
				kind: "course",
				coursePrerequisites: { sv: "Behörighet." },
				courseCode: "5DV001",
				timeRequired: "P3Y",
				courseWorkload: "PT40H",
				inLanguage: ["en"],
				isAccessibleForFree: true,
				courseMode: "OnlineEventAttendanceMode"
			});
		});

		it("states no program facts for a course", async () => {

			const read = drafted(course, url, reported);

			expect(read).not.toHaveProperty("timeToComplete");
			expect(read).not.toHaveProperty("programPrerequisites");

		});

	});

});
