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

import { salamanca } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import { course, program } from "./salamanca.js";


const programRecord = {
	programCode: "200",
	programName: "GRADO EN INFORMACIÓN Y DOCUMENTACIÓN",
	programUrl: "https://www.usal.es/node/474"
};

const courseRecord = {
	code: "100100",
	nameInSpanish: "INFORMACIÓN Y METODOLOGIA CIENTÍFICA",
	nameInEnglish: "Documentation and Scientific Methodology",
	ects: "3.00",
	url: "https://guias.usal.es/node/468",
	field_guias_asig_tdu_value: "S",
	field_guias_asig_tqu_value: "EST",
	field_guias_asig_cred_teor_value: null,
	field_guias_asig_cred_prac_value: null
};

const memberships = new Map([["100100", ["200", "253"]]]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("program", () => {

	it("reads the facts the record states", async () => {
		expect(program(programRecord)).toEqual({
			kind: "program",
			university: salamanca,
			key: "200",
			identifier: "200",
			name: { es: "GRADO EN INFORMACIÓN Y DOCUMENTACIÓN" },
			url: ["https://www.usal.es/node/474"]
		});
	});

	it("strips stray quotes", async () => {
		expect(program({ ...programRecord, programName: "\"GRADO EN FARMACIA\"" }))
			.toMatchObject({ name: { es: "GRADO EN FARMACIA" } });
		expect(program({ ...programRecord, programName: "'GRADO EN FARMACIA'" }))
			.toMatchObject({ name: { es: "GRADO EN FARMACIA" } });
	});

	it("reads no program without a code or a name", async () => {
		expect(program({ ...programRecord, programCode: " " })).toBeUndefined();
		expect(program({ ...programRecord, programName: null })).toBeUndefined();
		expect(program(null)).toBeUndefined();
	});

	it("leaves out an unusable web page", async () => {
		expect(program({ ...programRecord, programUrl: "node/474" })).toMatchObject({ url: [] });
	});

});


describe("course", () => {

	it("reads the facts the record states", async () => {
		expect(course(courseRecord, memberships)).toEqual({
			kind: "course",
			university: salamanca,
			key: "100100",
			courseCode: "100100",
			name: { en: "Documentation and Scientific Methodology", es: "INFORMACIÓN Y METODOLOGIA CIENTÍFICA" },
			url: ["https://guias.usal.es/node/468"],
			numberOfCredits: 3,
			timeRequired: "P180D",
			inProgram: [{ key: "200" }, { key: "253" }]
		});
	});

	it("maps teaching periods to the time required", async () => {
		expect(course({ ...courseRecord, field_guias_asig_tdu_value: "A" }, memberships))
			.toMatchObject({ timeRequired: "P365D" });
		expect(course({ ...courseRecord, field_guias_asig_tdu_value: "Q" }, memberships))
			.toMatchObject({ timeRequired: "P120D" });
		expect(course({ ...courseRecord, field_guias_asig_tdu_value: "T" }, memberships))
			.toMatchObject({ timeRequired: "P90D" });
		expect(course({ ...courseRecord, field_guias_asig_tdu_value: "I" }, memberships))
			.not.toHaveProperty("timeRequired");
	});

	it("names a course with only a Spanish name", async () => {
		expect(course({ ...courseRecord, nameInEnglish: " " }, memberships))
			.toMatchObject({ name: { es: "INFORMACIÓN Y METODOLOGIA CIENTÍFICA" } });
		expect(course({ ...courseRecord, nameInEnglish: "" }, memberships)?.name).not.toHaveProperty("en");
	});

	it("reads no course without a code or a name", async () => {
		expect(course({ ...courseRecord, code: "" }, memberships)).toBeUndefined();
		expect(course({ ...courseRecord, nameInEnglish: "", nameInSpanish: null }, memberships)).toBeUndefined();
	});

	it("links no program to a course no membership lists", async () => {
		expect(course(courseRecord, new Map())).toMatchObject({ inProgram: [] });
	});

	it("leaves out unusable credits", async () => {
		expect(course({ ...courseRecord, ects: "n/a" }, memberships)).not.toHaveProperty("numberOfCredits");
		expect(course({ ...courseRecord, ects: "0.00" }, memberships)).not.toHaveProperty("numberOfCredits");
	});

});
