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

import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { stakeholders } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { linz } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import { course, program } from "./linz.js";


const programRecord = {
	numberOfCredits: 120,
	educationalLevel: "https://data.ec2u.eu/concepts/isced-2011/7",
	url: ["https://www.jku.at/studium/studienarten/master/"],
	identifier: ["066/990"],
	name: { de: "JMP Global Business Russia/Italy" },
	description: { de: "Das Masterstudium ..." }
};

const courseRecord = {
	courseCode: "990CEBCCUCK13",
	inProgram: [programRecord],
	numberOfCredits: 3,
	educationalLevel: "https://data.ec2u.eu/concepts/isced-2011/7",
	url: ["https://studienhandbuch.jku.at/detail.php?lang=en&klaId=990CEBCCUCK13"],
	identifier: ["990CEBCCUCK13"],
	name: { de: "Cultural Context KS", en: "Cultural Context KS" }
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("program", () => {

	it("reads the facts the record states", async () => {
		expect(program(programRecord)).toEqual({
			kind: "program",
			university: linz,
			key: "066/990",
			identifier: "066/990",
			url: ["https://www.jku.at/studium/studienarten/master/"],
			name: { de: "JMP Global Business Russia/Italy" },
			description: { de: "Das Masterstudium ..." },
			numberOfCredits: 120,
			educationalLevel: [getTopicId(isced2011, "7")]
		});
	});

	it("reads no program without an identifier", async () => {
		expect(program({ ...programRecord, identifier: [] })).toBeUndefined();
		expect(program({ ...programRecord, identifier: [" "] })).toBeUndefined();
	});

	it("reads no program without a name", async () => {
		expect(program({ ...programRecord, name: { de: " " } })).toBeUndefined();
		expect(program({ ...programRecord, name: undefined })).toBeUndefined();
	});

	it("leaves out blank texts", async () => {
		expect(program({ ...programRecord, description: { de: " ", en: "A master." } }))
			.toMatchObject({ description: { en: "A master." } });
		expect(program({ ...programRecord, description: { de: "" } })).not.toHaveProperty("description");
	});

	it("leaves out unusable facts", async () => {

		const read = program({
			...programRecord,
			numberOfCredits: null,
			educationalLevel: "https://data.ec2u.eu/concepts/unknown/7",
			url: ["not a url"]
		});

		expect(read).not.toHaveProperty("numberOfCredits");
		expect(read).toMatchObject({ educationalLevel: [], url: [] });

	});

});


describe("course", () => {

	it("reads the facts the record states", async () => {
		expect(course(courseRecord)).toEqual({
			kind: "course",
			university: linz,
			key: "990CEBCCUCK13",
			courseCode: "990CEBCCUCK13",
			url: ["https://studienhandbuch.jku.at/detail.php?lang=en&klaId=990CEBCCUCK13"],
			name: { de: "Cultural Context KS", en: "Cultural Context KS" },
			numberOfCredits: 3,
			educationalLevel: [getTopicId(isced2011, "7")],
			audience: [],
			inProgram: [{ key: "066/990" }]
		});
	});

	it("reads no course without a course code", async () => {
		expect(course({ ...courseRecord, courseCode: "" })).toBeUndefined();
		expect(course({ ...courseRecord, courseCode: undefined })).toBeUndefined();
	});

	it("reads no course without a name", async () => {
		expect(course({ ...courseRecord, name: {} })).toBeUndefined();
	});

	it("tags lifelong learning courses as addressed to continuing education students", async () => {
		expect(course({ ...courseRecord, audience: ["Lifelong Learning"] })).toMatchObject({
			audience: [getTopicId(stakeholders, "teaching/students/continuing-education")]
		});
	});

	it("ignores unknown audiences", async () => {
		expect(course({ ...courseRecord, audience: ["Everybody"] })).toMatchObject({ audience: [] });
	});

	it("leaves out programs it cannot name", async () => {
		expect(course({ ...courseRecord, inProgram: [{ identifier: [] }, programRecord, {}] }))
			.toMatchObject({ inProgram: [{ key: "066/990" }] });
	});

});
