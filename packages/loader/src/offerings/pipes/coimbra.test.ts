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
import { coimbra } from "@ec2u/data-shared/universities/index.core.js";
import { opt } from "@metreeca/core";
import { describe, expect, it } from "vitest";
import { offering } from "./coimbra.core.js";


function localized(en: string, pt: string) {
	return [{ designacao: en, locSigla: "EN" }, { designacao: pt, locSigla: "PT" }];
}

const record = {
	cursoId: 9202,
	codigoInterno: "90123",
	cicloTipo: "SEGUNDO",
	categoriaCursoTipo: "CONTINUIDADE",
	designacoes: localized("Master in Physics", "Mestrado em Física"),
	urlPT: "https://apps.uc.pt/courses/PT/course/9202",
	urlEN: "https://apps.uc.pt/courses/EN/course/9202",
	ects: "120",
	duracaoPT: "2 Anos",
	duracaoEN: "2 Years",
	qualificoesAtribuidas: localized("Master degree", "Mestrado"),
	objetivosCurso: localized(" Contents. ", "Conteúdos."),
	objetivosAprendizagem: localized("Outcomes.", "Resultados."),
	condicoesAcesso: localized("Bachelor.", "Licenciatura."),
	regrasDeAvaliacao: localized("Exams.", "Exames."),
	linguasAprendizagem: localized("Portuguese and/or English", "Português e/ou Inglês")
};

const texts = {
	teaches: { en: "Contents.", pt: "Conteúdos." },
	assesses: { en: "Outcomes.", pt: "Resultados." },
	competencyRequired: { en: "Exams.", pt: "Exames." }
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("offering", () => {

	describe("program", () => {

		it("reads a degree program", async () => {
			expect(offering(record)).toEqual({

				kind: "program",

				university: coimbra,
				key: "9202",

				identifier: "9202",
				name: { en: "Master in Physics", pt: "Mestrado em Física" },
				url: ["https://apps.uc.pt/courses/EN/course/9202", "https://apps.uc.pt/courses/PT/course/9202"],

				...texts,
				programPrerequisites: { en: "Bachelor.", pt: "Licenciatura." },

				numberOfCredits: 120,
				timeToComplete: "P2Y",
				educationalLevel: [getTopicId(isced2011, "7")],
				educationalCredentialAwarded: {
					credentialCategory: "Degree",
					name: { en: "Master degree", pt: "Mestrado" }
				}

			});
		});

		it("maps cycles to ISCED 2011 levels", async () => {

			const level = (cicloTipo: string, categoriaCursoTipo?: string) =>
				offering({ ...record, cicloTipo, categoriaCursoTipo })?.educationalLevel;

			expect(level("PRIMEIRO")).toEqual([getTopicId(isced2011, "6")]);
			expect(level("SEGUNDO", "INTEGRADO")).toEqual([getTopicId(isced2011, "7")]);
			expect(level("SEGUNDO", "ESPECIALIZACAO_AVANCADA")).toEqual([getTopicId(isced2011, "7")]);
			expect(level("SEGUNDO", "FORMACAO_LONGO_VIDA")).toEqual([getTopicId(isced2011, "7")]);
			expect(level("TERCEIRO")).toEqual([getTopicId(isced2011, "8")]);
			expect(level("NAO_CONFERENTE_GRAU", "FORMACAO")).toEqual([getTopicId(isced2011, "9")]);
			expect(level("QUARTO")).toEqual([]);

		});

		it("reads the time to complete in calendar units", async () => {

			const time = (duracaoEN: string) => offering({ ...record, duracaoEN });

			expect(time("1 Year")).toMatchObject({ timeToComplete: "P1Y" });
			expect(time("6 semesters")).toMatchObject({ timeToComplete: "P36M" });
			expect(time("1 trimester")).toMatchObject({ timeToComplete: "P3M" });
			expect(time("2 weeks")).toMatchObject({ timeToComplete: "P14D" });
			expect(time("81 hours")).not.toHaveProperty("timeToComplete");

		});

	});

	describe("course", () => {

		const course = { ...record, cicloTipo: "NAO_CONFERENTE_GRAU", categoriaCursoTipo: "FORMACAO" };

		it("reads a course awarding no degree", async () => {
			expect(offering({ ...course, duracaoEN: "81 hours" })).toEqual({

				kind: "course",

				university: coimbra,
				key: "9202",

				courseCode: "9202",
				name: { en: "Master in Physics", pt: "Mestrado em Física" },
				url: ["https://apps.uc.pt/courses/EN/course/9202", "https://apps.uc.pt/courses/PT/course/9202"],

				...texts,
				coursePrerequisites: { en: "Bachelor.", pt: "Licenciatura." },

				numberOfCredits: 120,
				timeRequired: "PT81H",
				inLanguage: ["pt", "en"],
				educationalLevel: [getTopicId(isced2011, "9")],
				educationalCredentialAwarded: {
					credentialCategory: "Degree",
					name: { en: "Master degree", pt: "Mestrado" }
				}

			});
		});

		it("reads the time required in days or hours", async () => {

			const time = (duracaoEN: string) => offering({ ...course, duracaoEN });

			expect(time("3 days")).toMatchObject({ timeRequired: "P3D" });
			expect(time("121.5 hours")).toMatchObject({ timeRequired: "PT121H30M" });
			expect(time("1 semester")).not.toHaveProperty("timeRequired");

		});

		it("reads only the words naming a language", async () => {

			const languages = (designacao: string) => opt(offering({
				...course, linguasAprendizagem: [{ designacao, locSigla: "EN" }]
			}), draft => draft.kind === "course" ? draft.inLanguage : undefined);

			expect(languages("Portuguese Language.")).toEqual(["pt"]);
			expect(languages("Portuguese, English, French, Spanish and German")).toEqual(["pt", "en", "fr", "es", "de"]);
			expect(languages("The course is delivered in full time attendance.")).toEqual([]);

		});

	});

	describe("rejected records", () => {

		it("reads nothing from a record without an identifier or a name", async () => {
			expect(offering({ ...record, cursoId: undefined })).toBeUndefined();
			expect(offering({ ...record, designacoes: [] })).toBeUndefined();
		});

		it("leaves out unusable facts", async () => {

			const read = offering({ ...record, ects: "n/a", duracaoEN: "a while", urlEN: "course/9202" });

			expect(read).not.toHaveProperty("numberOfCredits");
			expect(read).not.toHaveProperty("timeToComplete");
			expect(read).toMatchObject({ url: ["https://apps.uc.pt/courses/PT/course/9202"] });

		});

	});

});
