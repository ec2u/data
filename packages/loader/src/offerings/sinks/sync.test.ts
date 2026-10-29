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

import { CommentLength, LabelLength } from "@ec2u/data-shared";
import { courses, getCourseId } from "@ec2u/data-shared/courses/index.js";
import { getOrganizationId, organizations } from "@ec2u/data-shared/organizations/index.js";
import { getPersonId, persons } from "@ec2u/data-shared/persons/index.js";
import { getProgramId, programs } from "@ec2u/data-shared/programs/index.js";
import { pavia, turku } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import {
	type Attached,
	type CourseDraft,
	date,
	identify,
	named,
	organization,
	person,
	type ProgramDraft,
	state
} from "./sync.js";


const source = "https://data.ec2u.eu/offerings/pavia";

const year = "2025/2026";

const program: ProgramDraft = {
	kind: "program",
	university: pavia,
	key: "05201",
	year,
	identifier: "05201",
	name: { it: "Ingegneria Informatica", en: "Computer Engineering" }
};

const course: CourseDraft = {
	kind: "course",
	university: pavia,
	key: "05201/500431",
	year,
	term: ["First"],
	courseCode: "500431",
	name: { it: "Basi di Dati", en: "Databases" }
};


function attached(draft: ProgramDraft | CourseDraft, extra: Partial<Attached> = {}): Attached {
	return { hash: "digest", draft, people: [], ...extra };
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("date", () => {

	const current = "2026/2027";

	it("infers the year of a draft stating none", async () => {
		expect(date({ ...program, year: undefined }, current)).toMatchObject({ year: current });
	});

	it("leaves a draft stating a year as it stands", async () => {

		expect(date(course, current)).toMatchObject({ year });

	});

	it("dates the programs a dated course lists with no year", async () => {
		expect(date({ ...course, year: undefined, inProgram: [{ key: "05201" }, { key: "05202", year }] }, current))
			.toMatchObject({ inProgram: [{ key: "05201", year: current }, { key: "05202", year }] });
	});

	it("leaves the programs of a course stating a year as they stand", async () => {
		expect(date({ ...course, inProgram: [{ key: "05201" }] }, current))
			.toMatchObject({ inProgram: [{ key: "05201" }] });
	});

	it("infers no terms", async () => {

		const { term, year, ...undated } = course;

		expect(date(undated, current)).not.toHaveProperty("term");

	});

});


describe("identify", () => {

	it("names a program by its key and year", async () => {
		expect(identify(program)).toBe(getProgramId(pavia.id, program.key, { year }));
	});

	it("names a course by its key, year and terms", async () => {
		expect(identify(course)).toBe(getCourseId(pavia.id, course.key, { year, term: ["First"] }));
	});

	it("names an offering within the university of its draft", async () => {
		expect(identify({ ...program, university: turku })).toBe(getProgramId(turku.id, program.key, { year }));
	});

	it("names nothing for a blank key", async () => {
		expect(identify({ ...program, key: " " })).toBeUndefined();
	});

	it("names nothing for a malformed year", async () => {
		expect(identify({ ...course, year: "2025-26" })).toBeUndefined();
	});

});


describe("state", () => {

	describe("identity", () => {

		it("states a program in the programs catalogue", async () => {
			expect(state(source, attached(program))).toMatchObject({
				id: getProgramId(pavia.id, program.key, { year }),
				dataset: programs.id,
				university: pavia.id,
				source,
				digest: "digest"
			});
		});

		it("states a course in the courses catalogue", async () => {
			expect(state(source, attached(course))).toMatchObject({
				id: getCourseId(pavia.id, course.key, { year, term: ["First"] }),
				dataset: courses.id,
				university: pavia.id,
				source,
				digest: "digest"
			});
		});

		it("flags an offering a model generated content for", async () => {
			expect(state(source, attached({ ...program, generated: true }))).toMatchObject({ generated: true });
		});

		it("leaves unflagged an offering stated by its source alone", async () => {
			expect(state(source, attached(program))).not.toHaveProperty("generated");
		});

		it("attributes the offering to the university of its draft", async () => {
			expect(state(source, attached({ ...course, university: turku }))).toMatchObject({
				id: getCourseId(turku.id, course.key, { year, term: ["First"] }),
				university: turku.id
			});
		});

		it("links programs within the university of the course", async () => {
			expect(state(source, attached({ ...course, university: turku, inProgram: [{ key: "05201" }] })))
				.toMatchObject({ inProgram: [getProgramId(turku.id, "05201")] });
		});

		it("states nothing for a draft it cannot identify", async () => {
			expect(state(source, attached({ ...program, key: "" }))).toBeUndefined();
		});

	});

	describe("facts", () => {

		it("keeps the facts the source states", async () => {
			expect(state(source, attached(course))).toMatchObject({
				name: course.name,
				year,
				term: ["First"],
				courseCode: "500431"
			});
		});

		it("leaks none of the draft's own terms", async () => {

			const stated = state(source, attached({ ...course, cues: { level: "Laurea" } }));

			expect(stated).not.toHaveProperty("kind");
			expect(stated).not.toHaveProperty("key");
			expect(stated).not.toHaveProperty("cues");

		});

	});

	describe("label", () => {

		it("labels the offering with its names", async () => {
			expect(state(source, attached(program))?.label).toEqual(program.name);
		});

		it("clips long names", async () => {

			const name = { en: "x".repeat(LabelLength*2) };

			expect(state(source, attached({ ...program, name }))?.label)
				.toEqual({ en: expect.stringMatching(new RegExp(`^.{1,${LabelLength}}$`)) });

		});

	});

	describe("comment", () => {

		const summary = { en: "A summary." };
		const description = { en: "A description." };
		const teaches = { en: "Some contents." };

		it("comments the offering with its summary first", async () => {
			expect(state(source, attached({ ...program, disambiguatingDescription: summary, description, teaches }))?.comment)
				.toEqual(summary);
		});

		it("falls back to the description", async () => {
			expect(state(source, attached({ ...program, description, teaches }))?.comment).toEqual(description);
		});

		it("falls back to the contents", async () => {
			expect(state(source, attached({ ...program, teaches }))?.comment).toEqual(teaches);
		});

		it("states no comment where no text is given", async () => {
			expect(state(source, attached(program))?.comment).toBeUndefined();
		});

		it("clips long texts", async () => {
			expect(state(source, attached({ ...program, description: { en: "x".repeat(CommentLength*2) } }))?.comment)
				.toEqual({ en: expect.stringMatching(new RegExp(`^.{1,${CommentLength}}$`, "s")) });
		});

	});

	describe("links", () => {

		it("links a course to its programs by the program identity rule", async () => {
			expect(state(source, attached({ ...course, inProgram: [{ key: "05201", year }, { key: "05202" }] })))
				.toMatchObject({
					inProgram: [
						getProgramId(pavia.id, "05201", { year }),
						getProgramId(pavia.id, "05202")
					]
				});
		});

		it("leaves out programs it cannot identify", async () => {
			expect(state(source, attached({ ...course, inProgram: [{ key: "05201", year: "2025" }, { key: "" }] })))
				.toMatchObject({ inProgram: [] });
		});

		it("links the settled provider", async () => {

			const provider = organization(source, pavia, { name: { en: "Department of Engineering" } });

			expect(state(source, attached(program, { provider }))).toMatchObject({ provider: provider.id });

		});

		it("states no provider where none was settled", async () => {
			expect(state(source, attached({ ...program, provider: { name: { en: "Rejected" } } }))?.provider)
				.toBeUndefined();
		});

		it("links only the instructors settled among the people", async () => {

			const valid = { givenName: "Ada", familyName: "Lovelace" };
			const invalid = { givenName: "Charles", familyName: "Babbage" };

			expect(state(source, attached({ ...course, instructor: [valid, invalid] }, {
				people: [person(source, pavia, valid)]
			}))).toMatchObject({ instructor: [getPersonId(pavia.id, "Lovelace", "Ada", source)] });

		});

	});

});


describe("named", () => {

	it("names the offering a draft states", async () => {
		expect(named(source, program)).toEqual([getProgramId(pavia.id, program.key, { year })]);
	});

	it("names the provider and instructors a draft states, within the source", async () => {
		expect(named(source, {
			...course,
			provider: { name: { en: "Engineering" } },
			instructor: [{ givenName: "Ada", familyName: "Lovelace" }]
		})).toEqual([
			getCourseId(pavia.id, course.key, { year, term: ["First"] }),
			getOrganizationId(pavia.id, "Engineering", source),
			getPersonId(pavia.id, "Lovelace", "Ada", source)
		]);
	});

	it("names nothing for a draft it cannot identify", async () => {
		expect(named(source, { ...program, key: "", provider: { name: { en: "Engineering" } } })).toEqual([]);
	});

});


describe("organization", () => {

	it("keys the organisation by its home page first, within the source", async () => {
		expect(organization(source, pavia, { name: { en: "Engineering" }, homepage: "https://example.org/" }).id)
			.toBe(getOrganizationId(pavia.id, "https://example.org/", source));
	});

	it("falls back to the English name", async () => {
		expect(organization(source, pavia, { name: { it: "Ingegneria", en: "Engineering" } }).id)
			.toBe(getOrganizationId(pavia.id, "Engineering", source));
	});

	it("falls back to any name", async () => {
		expect(organization(source, pavia, { name: { it: "Ingegneria" } }).id)
			.toBe(getOrganizationId(pavia.id, "Ingegneria", source));
	});

	it("states the organisation owned by the source under its names", async () => {
		expect(organization(source, pavia, { name: { it: "Ingegneria" }, homepage: "https://example.org/" })).toMatchObject({
			dataset: organizations.id,
			university: pavia.id,
			source,
			label: { it: "Ingegneria" },
			prefLabel: { it: "Ingegneria" },
			homepage: ["https://example.org/"]
		});
	});

});


describe("person", () => {

	it("states the person owned by the source under their full name", async () => {
		expect(person(source, pavia, { title: "Prof.", givenName: "Ada", familyName: "Lovelace" })).toMatchObject({
			id: getPersonId(pavia.id, "Lovelace", "Ada", source),
			dataset: persons.id,
			university: pavia.id,
			source,
			label: "Ada Lovelace",
			title: "Prof.",
			givenName: "Ada",
			familyName: "Lovelace"
		});
	});

});
