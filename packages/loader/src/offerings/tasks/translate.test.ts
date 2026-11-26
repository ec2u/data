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

import { pavia } from "@ec2u/data-shared/index.core.js";
import { describe, expect, it } from "vitest";
import type { CourseDraft, ProgramDraft } from "../sinks/sync.js";
import { merged, missing, sourced } from "./translate.js";


const course: CourseDraft = {

	kind: "course",
	university: pavia,
	key: "08402/502004",

	name: { it: "Metodi Matematici" },
	competencyRequired: { it: "Esame orale." },
	coursePrerequisites: { it: "Analisi." },

	educationalCredentialAwarded: { credentialCategory: "Degree", name: { it: "Dottorato di Ricerca" } },
	provider: { name: { it: "Dipartimento di Fisica" } }

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("sourced", () => {

	it("lists the texts stated in the local language alone", async () => {
		expect(sourced(course)).toEqual({
			name: "Metodi Matematici",
			requirements: "Esame orale.",
			prerequisites: "Analisi.",
			educationalCredential: "Dottorato di Ricerca",
			provider: "Dipartimento di Fisica"
		});
	});

	it("leaves out the texts already stated in English", async () => {
		expect(sourced({
			...course,
			name: { it: "Metodi Matematici", en: "Mathematical Methods" },
			provider: { name: { it: "Dipartimento di Fisica", en: "Department of Physics" } }
		})).toEqual({
			requirements: "Esame orale.",
			prerequisites: "Analisi.",
			educationalCredential: "Dottorato di Ricerca"
		});
	});

	it("reads the prerequisites of a program", async () => {

		const program: ProgramDraft = {
			kind: "program",
			university: pavia,
			key: "08402",
			name: { en: "Physics" },
			programPrerequisites: { it: "Diploma." }
		};

		expect(sourced(program)).toEqual({ prerequisites: "Diploma." });

	});

});


describe("missing", () => {

	it("lists nothing for a translation covering every given text", async () => {
		expect(missing(
			{ name: "Metodi Matematici", prerequisites: "Analisi." },
			{ name: "Mathematical Methods", prerequisites: "Calculus." }
		)).toEqual([]);
	});

	it("lists the given texts the translation leaves out", async () => {
		expect(missing(
			{ name: "Metodi Matematici", prerequisites: "Analisi.", provider: "Dipartimento di Fisica" },
			{ name: "Mathematical Methods" }
		)).toEqual(["prerequisites", "provider"]);
	});

	it("lists the given texts translated blank", async () => {
		expect(missing({ name: "Metodi Matematici" }, { name: " " })).toEqual(["name"]);
	});

	it("ignores translations of texts not given", async () => {
		expect(missing({ name: "Metodi Matematici" }, { name: "Mathematical Methods", summary: "Summary." }))
			.toEqual([]);
	});

});


describe("merged", () => {

	const translated = {
		name: "Mathematical Methods",
		requirements: "Oral exam.",
		prerequisites: "Calculus.",
		educationalCredential: "PhD",
		provider: "Department of Physics"
	};

	it("states each translation in English beside its original", async () => {
		expect(merged(course, translated)).toMatchObject({
			name: { it: "Metodi Matematici", en: "Mathematical Methods" },
			competencyRequired: { it: "Esame orale.", en: "Oral exam." },
			coursePrerequisites: { it: "Analisi.", en: "Calculus." }
		});
	});

	it("names the credential in English beside its original", async () => {
		expect(merged(course, translated)).toMatchObject({
			educationalCredentialAwarded: { credentialCategory: "Degree", name: { it: "Dottorato di Ricerca", en: "PhD" } }
		});
	});

	it("names the provider in English and flags it as generated", async () => {
		expect(merged(course, translated)).toMatchObject({
			provider: { name: { it: "Dipartimento di Fisica", en: "Department of Physics" }, generated: true }
		});
	});

	it("flags the draft as generated", async () => {
		expect(merged(course, translated)).toMatchObject({ generated: true });
	});

	it("leaves the provider as it stands where its name was not translated", async () => {
		expect(merged(course, { name: "Mathematical Methods" }).provider)
			.toEqual({ name: { it: "Dipartimento di Fisica" } });
	});

});
