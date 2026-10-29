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
import { iscedf2013 } from "@ec2u/data-shared/taxonomies/isced-f-2013.js";
import { sdgs } from "@ec2u/data-shared/taxonomies/sdgs.js";
import { stakeholders } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { coimbra } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import { row } from "./lll.core.js";


const year = "2025/2026";

const record = {
	"-": "",
	"University": "Coimbra",
	"Year": year,
	"Term": "second, first",
	"Title (English)": "Elementary Latin II",
	"Title (Local)": "Latim Elementar II",
	"Program (English)": "Beginners' Courses",
	"Program (Local)": "",
	"Provider (English)": "Faculty of Arts and Humanities",
	"Provider (Local)": "",
	"Instructor": "Urbano, Carlota; Abreu, Paula",
	"Code": "20174021",
	"Mode": "online",
	"Language": "pt, en",
	"Fee": "no",
	"Credits": "3.5",
	"Duration": "94.0",
	"Workload": "40.5",
	"ISCED-2011": "6, 7",
	"ISCED-F 2013": "0231",
	"SDG": "4",
	"Badge": "https://app.myopenbadge.com/badge/detail/DfAIGe-35cc9b365652",
	"URL (English)": "https://apps.uc.pt/courses/EN/course/5301",
	"URL (Local)": "https://apps.uc.pt/courses/PT/course/5301",
	"Description": "A Latin course.",
	"Syllabus": "Grammar and texts.",
	"Syllabus (Original)": "The course includes a strong grammar component.",
	"Prerequisites": "Elementary Latin I.",
	"Assessment": "",
	"Test": "written, oral",
	"Grade": "vote",
	"Scale": "0-20"
};

const program = "LLL/Beginners' Courses";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("row", () => {

	describe("course", () => {

		it("reads the facts the row states", async () => {
			expect(row(record)[0]).toEqual({

				kind: "course",

				university: coimbra,
				key: "LLL/20174021",
				year,
				term: ["First", "Second"],

				name: { en: "Elementary Latin II", pt: "Latim Elementar II" },
				courseCode: "20174021",
				url: ["https://apps.uc.pt/courses/EN/course/5301"],

				description: { en: "A Latin course." },
				teaches: { en: "Grammar and texts." },
				coursePrerequisites: { en: "Elementary Latin I." },
				competencyRequired: {
					en: "| Assessment | Type |\n|---|---|\n| Format | Written, Oral |\n| Grade | Vote |\n| Scale | 0-20 |\n"
				},

				courseMode: "OnlineEventAttendanceMode",
				inLanguage: ["pt", "en"],
				isAccessibleForFree: true,
				numberOfCredits: 3.5,
				timeRequired: "PT94H",
				courseWorkload: "PT40H30M",

				educationalLevel: [getTopicId(isced2011, "6"), getTopicId(isced2011, "7")],
				about: [
					getTopicId(iscedf2013, "02"),
					getTopicId(iscedf2013, "023"),
					getTopicId(iscedf2013, "0231"),
					getTopicId(sdgs, "4")
				],
				audience: [getTopicId(stakeholders, "teaching/students/continuing-education")],

				educationalCredentialAwarded: {
					credentialCategory: "Badge",
					url: ["https://app.myopenbadge.com/badge/detail/DfAIGe-35cc9b365652"]
				},

				provider: { name: { en: "Faculty of Arts and Humanities" } },
				instructor: [
					{ familyName: "Urbano", givenName: "Carlota" },
					{ familyName: "Abreu", givenName: "Paula" }
				],
				inProgram: [{ key: program, year }]

			});
		});

		it("keys a course without a code by its English title", async () => {
			expect(row({ ...record, "Code": "" })[0]).toMatchObject({ key: "LLL/Elementary Latin II" });
			expect(row({ ...record, "Code": "" })[0]).not.toHaveProperty("courseCode");
		});

		it("keys a course without a code or English title by its local title", async () => {
			expect(row({ ...record, "Code": "", "Title (English)": "" })[0]).toMatchObject({ key: "LLL/Latim Elementar II" });
		});

		it("keys by a code it cannot state as a course code", async () => {

			const [course] = row({ ...record, "Code": "480MABAMAMV12 / 241060" });

			expect(course).toMatchObject({ key: "LLL/480MABAMAMV12 / 241060" });
			expect(course).not.toHaveProperty("courseCode");

		});

		it("reads an each semester course as having no year", async () => {

			const [course, stub] = row({ ...record, "Year": "each semester" });

			expect(course).not.toHaveProperty("year");
			expect(course).toMatchObject({ inProgram: [{ key: program }] });
			expect(stub).not.toHaveProperty("year");

		});

		it("falls back to the local web page", async () => {
			expect(row({ ...record, "URL (English)": "" })[0])
				.toMatchObject({ url: ["https://apps.uc.pt/courses/PT/course/5301"] });
		});

	});

	describe("closed sets", () => {

		it("leaves out unrecognised values", async () => {

			const [course] = row({
				...record,
				"Term": "spring, first",
				"Mode": "remote",
				"Fee": "maybe",
				"ISCED-2011": "2, 6",
				"SDG": "18, 4",
				"Test": "essay",
				"Grade": "stars",
				"Scale": "assessment is based on written examinations"
			});

			expect(course).toMatchObject({
				term: ["First"],
				educationalLevel: [getTopicId(isced2011, "6")],
				about: [
					getTopicId(iscedf2013, "02"),
					getTopicId(iscedf2013, "023"),
					getTopicId(iscedf2013, "0231"),
					getTopicId(sdgs, "4")
				]
			});

			expect(course).not.toHaveProperty("courseMode");
			expect(course).not.toHaveProperty("isAccessibleForFree");
			expect(course).not.toHaveProperty("competencyRequired");

		});

		it("leaves out blank and non-positive amounts", async () => {

			const [course] = row({ ...record, "Credits": "0", "Duration": "", "Workload": "n/a" });

			expect(course).not.toHaveProperty("numberOfCredits");
			expect(course).not.toHaveProperty("timeRequired");
			expect(course).not.toHaveProperty("courseWorkload");

		});

	});

	describe("program", () => {

		it("states the program the course names, keyed by name and year", async () => {
			expect(row(record)[1]).toEqual({
				kind: "program",
				university: coimbra,
				key: program,
				year,
				name: { en: "Beginners' Courses" }
			});
		});

		it("states no program where the row names none", async () => {

			const drafts = row({ ...record, "Program (English)": "" });

			expect(drafts).toHaveLength(1);
			expect(drafts[0]).toMatchObject({ inProgram: [] });

		});

	});

	describe("rejected rows", () => {

		it("reads nothing from a disabled row", async () => {
			expect(row({ ...record, "-": "-" })).toEqual([]);
		});

		it("reads nothing from a row naming no partner university", async () => {
			expect(row({ ...record, "University": "Bologna" })).toEqual([]);
			expect(row({ ...record, "University": "" })).toEqual([]);
		});

		it("reads nothing from a row stating no title", async () => {
			expect(row({ ...record, "Title (English)": "", "Title (Local)": "" })).toEqual([]);
		});

		it("reads nothing from a row stating a malformed year", async () => {
			expect(row({ ...record, "Year": "2025" })).toEqual([]);
		});

	});

});
