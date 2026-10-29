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
import { opt, type Optional } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { tagName } from "@metreeca/work/core/language.js";
import { hours } from "@metreeca/work/core/temporal.js";
import { isHTTP } from "@metreeca/work/core/resources.js";
import type { CourseDraft, Dictionary, Draft, ProgramDraft } from "../sinks/sync.js";


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
 * An offering record of the Coimbra courses API.
 */
export type OfferingRecord = {

	readonly cursoId?: null | number
	readonly cicloTipo?: null | string
	readonly categoriaCursoTipo?: null | string

	readonly designacoes?: Localized
	readonly urlEN?: null | string
	readonly urlPT?: null | string

	readonly objetivosCurso?: Localized
	readonly objetivosAprendizagem?: Localized
	readonly regrasDeAvaliacao?: Localized
	readonly condicoesAcesso?: Localized
	readonly qualificoesAtribuidas?: Localized

	readonly ects?: null | string
	readonly duracaoEN?: null | string
	readonly linguasAprendizagem?: Localized

}

/**
 * A text the Coimbra courses API states in several languages, one item per language.
 */
export type Localized = null | readonly {

	readonly locSigla: string
	readonly designacao?: null | string

}[]


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
export function offering({
	cursoId, cicloTipo, categoriaCursoTipo, designacoes, urlEN, urlPT,
	objetivosCurso, objetivosAprendizagem, regrasDeAvaliacao, condicoesAcesso, qualificoesAtribuidas,
	ects, duracaoEN, linguasAprendizagem
}: OfferingRecord): Optional<Draft> {
	return opt(cursoId ?? undefined, id => opt(localized(designacoes), name => {

		const key = String(id);
		const cycle = cicloTipo ?? "";
		const category = categoriaCursoTipo ?? "*";

		const common = immutable({

			university: coimbra,
			key,

			name,
			url: [urlEN ?? "", urlPT ?? ""].filter(isHTTP),

			...opt(localized(objetivosCurso), teaches => ({ teaches })),
			...opt(localized(objetivosAprendizagem), assesses => ({ assesses })),
			...opt(localized(regrasDeAvaliacao), competencyRequired => ({ competencyRequired })),

			...opt(opt(ects ?? undefined, Number.parseFloat), credits =>
				Number.isFinite(credits) && credits > 0 ? { numberOfCredits: credits } : {}
			),

			educationalLevel: [opt(Levels[cycle], categories => categories[category] ?? categories["*"])]
				.flatMap(multiple)
				.map(level => getTopicId(isced2011, level)),

			...opt(localized(qualificoesAtribuidas), name => ({
				educationalCredentialAwarded: { credentialCategory: "Degree", name }
			} satisfies Pick<Draft, "educationalCredentialAwarded">))

		});

		const prerequisites = localized(condicoesAcesso);
		const duration = duracaoEN?.trim().toLowerCase() ?? "";

		const course = (): CourseDraft => immutable({

			kind: "course",

			...common,

			courseCode: key,
			...opt(prerequisites, coursePrerequisites => ({ coursePrerequisites })),
			...opt(time(duration), timeRequired => ({ timeRequired })),
			inLanguage: languages(linguasAprendizagem)

		});

		const program = (): ProgramDraft => immutable({

			kind: "program",

			...common,

			identifier: key,
			...opt(prerequisites, programPrerequisites => ({ programPrerequisites })),
			...opt(period(duration), timeToComplete => ({ timeToComplete }))

		});

		return cycle === "NAO_CONFERENTE_GRAU" ? course() : program();

	}));
}


/**
 * Reads a localised list, keyed by lowercase `locSigla`, leaving out blank texts.
 */
function localized(texts: Optional<Localized>): Optional<Dictionary> {

	const entries = (texts ?? []).flatMap(({ locSigla, designacao }) =>
		opt(designacao?.trim() || undefined, text => [[locSigla.toLowerCase(), text]]) ?? []
	);

	return entries.length > 0 ? Object.fromEntries(entries) : undefined;

}

/**
 * Reads an amount of calendar units as an ISO 8601 period.
 */
function period(duration: string): Optional<string> {
	return opt(/^(\d+)\s+([a-z]+?)s?$/.exec(duration) ?? undefined, ([, amount, unit]) =>
		Periods[unit]?.(Number.parseInt(amount, 10))
	);
}

/**
 * Reads an amount of days or hours as an ISO 8601 duration.
 */
function time(duration: string): Optional<string> {
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
function languages(texts: Optional<Localized>): readonly string[] {
	return [...new Set((texts ?? [])
		.flatMap(({ locSigla, designacao }) => locSigla === "EN" ? designacao?.split(/\P{L}+/u) ?? [] : [])
		.map(tagName)
		.flatMap(multiple)
	)];
}
