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

import { base } from "@ec2u/data-shared";
import { getAcademicYear } from "@ec2u/data-shared/offerings/index.js";
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { coimbra } from "@ec2u/data-shared/universities/index.core.js";
import { isArray, isNumber, isObject, isString, opt } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { degree, hours, isWeb, languageTags } from "../index.core.js";
import { type CourseDraft, type Dictionary, type Draft, type ProgramDraft, sync } from "../sinks/sync.js";


const Source = resolve(base, "/offerings/coimbra");

const DataURL = "offerings-coimbra-url";
const DataId = "offerings-coimbra-id";
const DataToken = "offerings-coimbra-token";

/**
 * The ISCED 2011 levels of degree cycles, keyed by `cicloTipo` and then by `categoriaCursoTipo`, `*` matching any.
 */
const Levels: { readonly [cycle: string]: { readonly [category: string]: string } } = {
	PRIMEIRO: { "*": "6" },
	SEGUNDO: { INTEGRADO: "7", CONTINUIDADE: "7", ESPECIALIZACAO_AVANCADA: "7", FORMACAO_LONGO_VIDA: "7" },
	TERCEIRO: { "*": "8" },
	NAO_CONFERENTE_GRAU: {
		POS_DOUTORAMENTO: "9", ESPECIALIZACAO: "9", FORMACAO: "9", FORMACAO_CONTINUA: "9", ESPECIALIZACAO_AVANCADA: "9"
	}
};

/**
 * The ISO 8601 periods of calendar amounts, keyed by unit.
 */
const Periods: { readonly [unit: string]: (amount: number) => string } = {
	year: amount => `P${amount}Y`,
	semester: amount => `P${6*amount}M`,
	trimester: amount => `P${3*amount}M`,
	month: amount => `P${amount}M`,
	week: amount => `P${7*amount}D`,
	day: amount => `P${amount}D`
};

/**
 * The ISO 639-1 tags of languages, keyed by their lowercase English name.
 */
const Languages = languageTags("en");


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Coimbra);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs and courses listed by the Coimbra courses API for the current academic year.
 *
 * Asks the API for the offerings with a course sheet in the academic year current at retrieval, switching in August,
 * the one year the API answers for at a time. The records state no year of their own, so the sink dates them with the
 * same year and marks it as inferred. A response the API does not report as a success yields no drafts at all, so the
 * run retracts nothing on the strength of it and fails on the retraction floor instead.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Coimbra() {

	const vault = service(createVault);

	const request = new Request(`${await vault(DataURL)}/obtemCursosBloco`, {

		method: "POST",

		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Accept": "application/json"
		},

		body: new URLSearchParams({
			applicationId: await vault(DataId),
			accessToken: await vault(DataToken),
			obterInformacaoFichaCurso: "true",
			devolverSoCursosComFichaCurso: "true",
			anoLectivo: getAcademicYear(new Date())
		})

	});

	return pipe(
		(items([request]))
		(fetch())
		(flat(map(async response => {

			const json: unknown = await response.json();

			if ( isObject(json) && json.status === "SUCCESS" && isArray(json.listaResultados) ) {

				return json.listaResultados;

			} else {

				logger.error`unexpected response with status <${isObject(json) ? json.status : undefined}>`;

				return [];

			}

		})))
		(flat(map(read)))
		(sync(Source))
	);

}


function read(record: unknown): readonly Draft[] {

	const draft = offering(record);

	if ( draft === undefined ) {

		logger.warning`malformed record <${clip(JSON.stringify(record), 100)}>`;

		return [];

	} else {

		return [draft];

	}

}


/**
 * Reads an offering record of the Coimbra courses API.
 *
 * A record is a degree program unless its `cicloTipo` is `NAO_CONFERENTE_GRAU`, which marks a course awarding no
 * degree; either is keyed by its `cursoId`, stated as its identifier or course code. Names, the credential awarded,
 * contents, learning outcomes, prerequisites and examination rules are read from the localised lists the record
 * states, keyed by `locSigla`; both web pages and the `ects` credits are stated as given. The ISCED 2011 level is
 * mapped from `cicloTipo` and `categoriaCursoTipo`: first cycles to bachelor's level, second cycles to master's level,
 * third cycles to doctoral level, and non-degree courses to level 9. `duracaoEN` is read as the time a program takes
 * to complete in years, semesters, trimesters, months, weeks or days, and as the time a course requires in days or
 * hours. Teaching languages are read from the English names in `linguasAprendizagem`, ignoring words that name no
 * language.
 *
 * @param record The offering record as the API states it
 *
 * @returns The draft of the program or course, or `undefined` if the record states no identifier or no name
 */
export function offering(record: unknown): undefined | Draft {

	if ( isObject(record) && isNumber(record.cursoId) ) {

		const key = String(record.cursoId);
		const cycle = isString(record.cicloTipo) ? record.cicloTipo : "";
		const category = isString(record.categoriaCursoTipo) ? record.categoriaCursoTipo : "*";

		return opt(localized(record.designacoes), name => {

			const common = immutable({

				university: coimbra,
				key,

				name,
				url: [record.urlEN, record.urlPT].filter(isString).filter(isWeb),

				...opt(localized(record.objetivosCurso), teaches => ({ teaches })),
				...opt(localized(record.objetivosAprendizagem), assesses => ({ assesses })),
				...opt(localized(record.regrasDeAvaliacao), competencyRequired => ({ competencyRequired })),

				...opt(isString(record.ects) ? Number.parseFloat(record.ects) : undefined, credits =>
					Number.isFinite(credits) && credits > 0 ? { numberOfCredits: credits } : {}
				),

				educationalLevel: [opt(Levels[cycle], categories => categories[category] ?? categories["*"])]
					.flatMap(multiple)
					.map(level => getTopicId(isced2011, level)),

				...opt(localized(record.qualificoesAtribuidas), name => ({ educationalCredentialAwarded: degree(name) }))

			});

			const prerequisites = localized(record.condicoesAcesso);
			const duration = isString(record.duracaoEN) ? record.duracaoEN.trim().toLowerCase() : "";

			const course = (): CourseDraft => immutable({

				kind: "course",

				...common,

				courseCode: key,
				...opt(prerequisites, coursePrerequisites => ({ coursePrerequisites })),
				...opt(time(duration), timeRequired => ({ timeRequired })),
				inLanguage: languages(record.linguasAprendizagem)

			});

			const program = (): ProgramDraft => immutable({

				kind: "program",

				...common,

				identifier: key,
				...opt(prerequisites, programPrerequisites => ({ programPrerequisites })),
				...opt(period(duration), timeToComplete => ({ timeToComplete }))

			});

			return cycle === "NAO_CONFERENTE_GRAU" ? course() : program();

		});

	} else {

		return undefined;

	}

}


/**
 * Reads a localised list, keyed by lowercase `locSigla`, leaving out blank texts.
 */
function localized(value: unknown): undefined | Dictionary {

	const texts: Dictionary = Object.fromEntries((isArray(value) ? value : []).flatMap(item =>
		isObject(item) && isString(item.locSigla) && isString(item.designacao) && item.designacao.trim() !== ""
			? [[item.locSigla.toLowerCase(), item.designacao.trim()]]
			: []
	));

	return Object.keys(texts).length > 0 ? texts : undefined;

}

/**
 * Reads an amount of calendar units as an ISO 8601 period.
 */
function period(duration: string): undefined | string {
	return opt(/^(\d+)\s+([a-z]+?)s?$/.exec(duration) ?? undefined, ([, amount, unit]) =>
		Periods[unit]?.(Number.parseInt(amount, 10))
	);
}

/**
 * Reads an amount of days or hours as an ISO 8601 duration.
 */
function time(duration: string): undefined | string {
	return opt(/^(\d+(?:\.\d+)?)\s+(day|hour)s?$/.exec(duration) ?? undefined, ([, amount, unit]) => {

		const value = Number.parseFloat(amount);

		return unit === "day"
			? Number.isInteger(value) ? `P${value}D` : undefined
			: hours(value);

	});
}

/**
 * Reads the languages named in the English descriptions of a list, in order of first mention.
 */
function languages(value: unknown): readonly string[] {
	return [...new Set((isArray(value) ? value : [])
		.flatMap(item => isObject(item) && item.locSigla === "EN" && isString(item.designacao)
			? item.designacao.split(/\P{L}+/u)
			: []
		)
		.map(word => Languages.get(word.toLowerCase()))
		.flatMap(multiple)
	)];
}
