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
import { sdgs } from "@ec2u/data-shared/taxonomies/sdgs.js";
import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { isArray, isNumber, isObject, isString, opt } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, fork, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { string, type Target, xml, xpath, type XPath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { hours, languageTags, text } from "../index.core.js";
import { type CourseDraft, type Dictionary, type Draft, type ProgramDraft, sync } from "../sinks/sync.js";


const Source = resolve(base, "/offerings/pavia");

const OfferURL = "https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/";
const CatalogueURL = "https://unipv.coursecatalogue.cineca.it";

const PlanURL = "offerings-pavia-url";
const PlanUser = "offerings-pavia-usr";
const PlanPassword = "offerings-pavia-pwd";

const PageSize = 100; // the number of programs read from ESSE3 at a time
const CohortDepth = 4; // the number of enrolment years tried when locating a program page
const CommonTrack = "00"; // the study track marking activities common to the whole program

const retrieval = 10; // the number of programs harvested at the same time // !!! as option

/**
 * The program types the catalogue publishes pages for.
 */
const Published = new Set(["L2", "LC5", "LC6", "LM", "LM5", "LM6"]);

/**
 * The ISCED 2011 levels of program types.
 */
const Levels: { readonly [type: string]: string } = {
	L2: "6", // Corso di Laurea
	LC5: "7", // Laurea Ciclo Unico 5 anni
	LC6: "7", // Laurea Ciclo Unico 6 anni
	LM: "7", // Corso di Laurea Magistrale
	LM5: "7", // Laurea Magistrale Ciclo Unico 5 anni
	LM6: "7", // Laurea Magistrale Ciclo Unico 6 anni
	M1: "7", // Master di Primo Livello
	M2: "7", // Master di Secondo Livello
	CPA: "7", // Corso di Perfezionamento
	D1: "8", // Corso di Dottorato di ricerca
	SP2: "8", // Scuola di Specializzazione (2 anni)
	SP3: "8", // Scuola di Specializzazione (3 anni)
	SP4: "8", // Scuola di Specializzazione (4 anni)
	SP5: "8", // Scuola di Specializzazione (5 anni)
	SP6: "8", // Scuola di Specializzazione (6 anni)
	FI: "9", // Formazione iniziale insegnanti
	PAS: "9", // Percorso Abilitante Speciale
	CS: "9" // Corso Singolo
};

const Terms: { readonly [cycle: string]: NonNullable<CourseDraft["term"]>[number] } = {
	A1: "Annual",
	S1: "First",
	S2: "Second"
};

const Modes: { readonly [mode: string]: NonNullable<CourseDraft["courseMode"]> } = {
	"Convenzionale": "OfflineEventAttendanceMode",
	"Teledidattica": "OnlineEventAttendanceMode",
	"Blend/modalità mista": "MixedEventAttendanceMode"
};

/**
 * The ISO 639-1 tags of languages, keyed by their lowercase Italian name.
 */
const Languages = languageTags("it");


const logger = log(import.meta.url);


/**
 * A catalogue page an offering may be published on, along with the API address telling whether it is.
 *
 * Catalogue pages are resolved client-side and always answer, so whether a page exists is told by the matching API
 * endpoint answering a `HEAD` request rather than by the page itself, which answers even for missing offerings.
 */
export type Page = {

	readonly probe: string
	readonly url: string

}

/**
 * A course read from a program teaching plan, along with the catalogue page it would be published on.
 */
export type Activity = {

	readonly draft: CourseDraft
	readonly page?: Page

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Pavia);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs and courses Pavia offers in the current academic year.
 *
 * Reads the programs ESSE3 lists for the academic year current at retrieval, switching in August, page by page until a
 * short page closes the listing, then the teaching plan UGov exports for each of them. A teaching plan that fails to
 * load fails the run before anything is stated, so the courses of a program are never retracted on the strength of a
 * failed request. Programs and courses are linked to their catalogue pages where the catalogue confirms them, and
 * qualified as {@link programs} and {@link courses} describe, before being stated.
 *
 * @returns A promise resolving to a tally of what the run did
 *
 * @throws {@link !Error Error} If the teaching plan of a listed program fails to load
 */
export async function Pavia() {

	const vault = service(createVault);

	const offer = Number.parseInt(getAcademicYear(new Date()).slice(0, 4), 10);

	const [url, user, password] = await Promise.all([vault(PlanURL), vault(PlanUser), vault(PlanPassword)]);
	const authorization = `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

	const harvests = await pipe(
		(items(await listing(offer)))
		(fork(retrieval, records => pipe(
			(items(records))
			(map(harvest))
		)))
		(toArray())
	);

	const failed = harvests.filter(({ plan }) => !plan).length;

	if ( failed > 0 ) {

		throw new Error(`failed teaching plans for <${failed}> programs`);

	} else {

		const stated = programs(harvests.flatMap(({ program }) => program === undefined ? [] : [program]));
		const taught = qualify(harvests.flatMap(({ courses }) => courses), stated);

		return pipe(
			(items<Draft>([...stated, ...taught]))
			(sync(Source))
		);

	}


	async function harvest(record: unknown): Promise<{

		readonly program?: { readonly draft: ProgramDraft, readonly cohort?: number }
		readonly courses: readonly CourseDraft[]
		readonly plan: boolean

	}> {

		const page = await first(pages(record));
		const draft = program(record, page?.url);

		const plans = isObject(record) && isString(record.cdsCod) && isNumber(record.aaOffId)
			? await teaching(record.cdsCod, record.aaOffId)
			: [];

		const located = await Promise.all(plans.flatMap(courses).map(async ({ draft, page }) =>
			page !== undefined && await resolves(page.probe) ? immutable({ ...draft, url: [page.url] }) : draft
		));

		if ( draft === undefined ) {
			logger.warning`malformed program <${isObject(record) ? record.cdsCod : undefined}>`;
		}

		return immutable({

			...opt(draft, draft => ({ program: { draft, ...opt(page?.cohort, cohort => ({ cohort })) } })),

			courses: located,
			plan: plans.length > 0

		});

	}

	async function teaching(code: string, year: number): Promise<readonly XPath[]> {
		return pipe(
			(items([new Request(url, {

				method: "POST",

				headers: {
					"Accept": "text/xml",
					"Content-Type": "text/xml",
					"Authorization": authorization
				},

				// the UGov SOAP request exporting the teaching plan of a program for an offer year

				body: `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Header/><soap:Body>`
					+`<ws:ProgrammazioneDidattica xmlns:ws="http://ws.di.u-gov.cineca.it/">`
					+`<parametriEsportazioneProgrammazioneDidattica>`
					+`<aaOffId>${year}</aaOffId>`
					+`<cdsCod>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</cdsCod>`
					+`</parametriEsportazioneProgrammazioneDidattica>`
					+`</ws:ProgrammazioneDidattica></soap:Body></soap:Envelope>`

			})]))
			(fetch())
			(xml())
			(xpath())
			(toArray())
		);
	}

}


/**
 * Reads the ESSE3 programs offered in a year, page by page until a short page closes the listing.
 */
async function listing(offer: number, start = 0): Promise<readonly unknown[]> {

	const page = await pipe(
		(items([`${OfferURL}?aaOffId=${offer}&start=${start}&limit=${PageSize}`]))
		(fetch())
		(flat(map(async response => opt(await response.json(), (json: unknown) => isArray(json) ? json : []) ?? [])))
		(toArray())
	);

	return page.length < PageSize ? page : [...page, ...await listing(offer, start+PageSize)];

}

/**
 * Finds the first page the catalogue confirms.
 */
async function first<P extends Page>(pages: readonly P[]): Promise<undefined | P> {
	return pages.length === 0 ? undefined
		: await resolves(pages[0].probe) ? pages[0]
			: first(pages.slice(1));
}

/**
 * Checks whether a catalogue API endpoint answers, as it does only for a page that exists.
 */
async function resolves(url: string): Promise<boolean> {
	return (await pipe(
		(items([new Request(url, { method: "HEAD" })]))
		(fetch())
		(toArray())
	)).length > 0;
}

/**
 * Reads a program record of the ESSE3 offer API.
 *
 * The program is keyed by its `cdsCod`, which it also states as its identifier, and delivered in the academic year
 * starting in its `aaOffId`; it is named in Italian by its `cdsDes`, its `tipoCorsoCod` mapped to an ISCED 2011 level
 * and its department, named by `dipDes`, stated as its provider unless `dipCod` is the `NN` placeholder.
 *
 * @param record The program record as the API states it
 * @param page The catalogue page confirmed for the program, if any
 *
 * @returns The draft of the program, or `undefined` if the record states no code, no name or no offer year
 */
export function program(record: unknown, page?: string): undefined | ProgramDraft {
	return isObject(record) && isNumber(record.aaOffId) && Number.isInteger(record.aaOffId)
		? opt(text(record.cdsCod), key => opt(text(record.cdsDes), name => immutable({

			kind: "program",

			university: pavia,
			key,
			year: academic(Number(record.aaOffId)),

			identifier: key,
			name: { [pavia.locale]: name },
			url: [page].flatMap(multiple),

			educationalLevel: [opt(text(record.tipoCorsoCod), type => Levels[type])]
				.flatMap(multiple)
				.map(level => getTopicId(isced2011, level)),

			...opt(text(record.dipCod) === "NN" ? undefined : text(record.dipDes), department => ({
				provider: { name: { [pavia.locale]: department } }
			}))

		})))
		: undefined;
}

/**
 * Lists the catalogue pages a program may be published on, most likely first.
 *
 * Only the program types the catalogue publishes have pages. A program page is served under the enrolment year of the
 * most recent cohort still taught, which is the offer year only for programs still open to enrolment, so the offer year
 * and the three before it are tried in turn, until the catalogue confirms one of them as published.
 *
 * @param record The program record as the ESSE3 offer API states it
 *
 * @returns The candidate pages of the program with the enrolment year of the cohort each stands for, most recent first;
 * empty for a program type the catalogue does not publish, or for a record stating no code or offer year
 */
export function pages(record: unknown): readonly (Page & { readonly cohort: number })[] {
	return isObject(record) && isNumber(record.aaOffId) && Published.has(text(record.tipoCorsoCod) ?? "")
		? opt(text(record.cdsCod), code => Array.from({ length: CohortDepth }, (_, offset) => Number(record.aaOffId)-offset)
		.map(cohort => immutable({
			cohort,
			probe: `${CatalogueURL}/api/v1/corso-code?anno=${cohort}&cdsCod=${code}`,
			url: `${CatalogueURL}/corsi-code/${cohort}/${code}`
		}))) ?? []
		: [];
}

/**
 * Reads the courses of a UGov teaching plan.
 *
 * Every learning activity listed under a study track of a regulation of the program is read as a course of the
 * program, keyed by program and `afGenCod`, so that each course stands for the page the catalogue publishes for it
 * within its program; an activity listed by several regulations is read once, from the most recent. A course is
 * delivered in the academic year starting in the plan `aaOffId` and in the term `tipoCicloCod` names; it is named in
 * English and Italian, timed by its contact and study hours, described by its plan texts in the language each states,
 * tagged with the SDGs its sustainability text numbers, and stated as taught in the languages and mode the plan names.
 *
 * The catalogue page of a course is keyed by the ordinamento year of its regulation, read from `cdsordCod` rather
 * than `aaRegdidId`, and by the program track; an activity common to the whole program, under track `00`, is
 * published under the first actual track of its regulation, and an unreadable ordinamento leaves it with no page.
 *
 * @param plan The teaching plan as the UGov export states it
 *
 * @returns The courses of the plan, along with the catalogue page each would be published on
 */
export function courses(plan: XPath): readonly Activity[] {
	return plan("//ns2:cds").flatMap(cds => {

		const scope = xpath(cds);

		const program = value(scope, "ns2:cdsCod");
		const offer = opt(value(scope, "ns2:aaOffId"), year => /^\d{4}$/.test(year) ? Number(year) : undefined);

		if ( program === undefined || offer === undefined ) {

			return [];

		} else {

			const listed = scope("ns2:regdid").flatMap(activities);

			// an activity listed by several regulations is read once, from the most recent one

			const latest = [...new Set(listed.map(({ code }) => code))].map(code => listed
				.filter(activity => activity.code === code)
				.reduce((latest, activity) => activity.rank > latest.rank ? activity : latest)
			);

			return latest.flatMap(activity => opt(course(activity, program, offer), draft => [immutable({
				draft,
				...opt(activity.ordinamento, ordinamento => ({
					page: page(offer, activity.code, ordinamento, activity.track, program)
				}))
			})]) ?? []);

		}

	});
}


type Listed = {

	readonly code: string
	readonly rank: string
	readonly ordinamento?: string
	readonly track: string
	readonly af: Target

}

/**
 * Lists the activities of a regulation, along with the ordinamento year and track the catalogue keys their pages by.
 */
function activities(regdid: Target): readonly Listed[] {

	const scope = xpath(regdid);

	// the catalogue keys pages on the ordinamento year, `01400-08` giving 2008, not on the regulation year

	const ordinamento = opt(value(scope, "ns2:cdsordCod"), code => opt(/-(\d{2})$/.exec(code) ?? undefined, ([, year]) =>
		`20${year}`
	));

	const regulation = value(scope, "ns2:aaRegdidId") ?? "";
	const rank = `${ordinamento ?? ""}|${regulation}`;

	const actual = scope("ns2:pds/ns2:pdsCod")
		.map(code => string(code).trim())
		.filter(code => code !== CommonTrack)
		.reduce<undefined | string>((first, code) => first === undefined || code < first ? code : first, undefined);

	return scope("ns2:pds").flatMap(pds => {

		const tracks = xpath(pds);
		const code = value(tracks, "ns2:pdsCod") ?? "";

		// activities common to the whole program are published under each of its actual tracks

		const track = code === CommonTrack ? actual ?? code : code;

		return tracks("ns2:af").flatMap(af => opt(value(xpath(af), "ns2:afGenCod"), activity => [immutable({
			code: activity,
			rank,
			...opt(ordinamento, ordinamento => ({ ordinamento })),
			track,
			af
		})]) ?? []);

	});

}

function course({ code, af }: Listed, program: string, offer: number): undefined | CourseDraft {

	const scope = xpath(af);
	const year = academic(offer);

	const name: Dictionary = {
		...opt(value(scope, "ns2:afGenDesEng"), en => ({ en })),
		...opt(value(scope, "ns2:afGenDes"), it => ({ [pavia.locale]: it }))
	};

	return Object.keys(name).length === 0 ? undefined : immutable({

		kind: "course",

		university: pavia,
		key: `${program}/${code}`,
		year,
		term: opt(value(scope, "ns2:tipoCicloCod"), cycle => opt(Terms[cycle], term => [term])) ?? [],

		courseCode: code,
		name,

		...opt(texts(scope, "CONTENUTI", "METODI_DID", "TESTI_RIF"), teaches => ({ teaches })),
		...opt(texts(scope, "OBIETT_FORM"), assesses => ({ assesses })),
		...opt(texts(scope, "PREREQ"), coursePrerequisites => ({ coursePrerequisites })),
		...opt(texts(scope, "MOD_VER_APPR"), competencyRequired => ({ competencyRequired })),

		...opt(duration(value(scope, "ns2:oreFrontAf")), timeRequired => ({ timeRequired })),
		...opt(duration(value(scope, "ns2:oreStuInd")), courseWorkload => ({ courseWorkload })),

		inLanguage: [...new Set(scope("ns2:linDid/ns2:linDidAf/ns2:linDidDes")
			.map(name => Languages.get(string(name).trim().toLowerCase()))
			.flatMap(multiple)
		)],

		...opt(opt(value(scope, "ns2:modDid/ns2:modDidAf/ns2:modDidDes"), mode => Modes[mode]), courseMode => ({
			courseMode
		})),

		about: [...new Set(scope("ns2:testi[1]/ns2:testo[ns2:tipoTestoCod='OB_SVIL_SOS']/ns2:contenuto")
			.flatMap(text => [...string(text).matchAll(/\b(\d+)(?:\.\w+)*/g)].map(([, goal]) => Number(goal)))
			.filter(goal => goal >= 1 && goal <= 17)
		)].map(goal => getTopicId(sdgs, String(goal))),

		inProgram: [{ key: program, year }]

	});

}

function page(offer: number, course: string, ordinamento: string, track: string, program: string): Page {
	return immutable({
		probe: `${CatalogueURL}/api/v1/insegnamento-code`
			+`?aa_offerta=${offer}&cod_af=${course}&aa_ordinamento=${ordinamento}&af_percorso=${track}&cod_corso=${program}`,
		url: `${CatalogueURL}/insegnamenti-code/${offer}/${course}/${ordinamento}/${track}/${program}`
	});
}

/**
 * Reads the plan texts of the given types, keyed by language and joined in the order the types are given.
 */
function texts(scope: XPath, ...types: readonly string[]): undefined | Dictionary {

	// several text sections are possible, as for course partitions: the first one is read

	const entries = types.flatMap(type => scope(`ns2:testi[1]/ns2:testo[ns2:tipoTestoCod='${type}']`).flatMap(testo => {

		const text = xpath(testo);

		// the plan states ISO 639-2 language codes

		const language = opt(value(text, "ns2:linguaCod"), code =>
			/^[a-z]{2,3}$/.test(code) ? new Intl.Locale(code).maximize().language : undefined
		);

		return opt(value(text, "ns2:contenuto"), content => opt(language, language => [{ language, content }])) ?? [];

	}));

	const languages = [...new Set(entries.map(({ language }) => language))];

	return languages.length === 0 ? undefined : Object.fromEntries(languages.map(language => [language, entries
		.filter(entry => entry.language === language)
		.map(({ content }) => content)
		.join("\n\n")
	]));

}

/**
 * Reads an amount of hours as an ISO 8601 duration, leaving out non-positive amounts.
 */
function duration(value: undefined | string): undefined | string {
	return opt(opt(value, Number.parseFloat), amount => Number.isFinite(amount) && amount > 0 ? hours(amount) : undefined);
}

/**
 * Reads the first value an expression selects, trimmed, leaving out blank ones.
 */
function value(scope: XPath, expression: string): undefined | string {
	return opt(scope(expression)[0], node => text(string(node)));
}

function academic(start: number): string {
	return `${start}/${start+1}`;
}

/**
 * Lists the names shared by more than one of a set of language maps, as `tag:name` keys.
 */
function shared(names: readonly Dictionary[]): ReadonlySet<string> {

	const keys = names.flatMap(name => Object.entries(name).map(([tag, label]) => `${tag}:${label}`));
	const sorted = [...keys].sort(); // ;( no es2023 toSorted(): sorts a copy

	return new Set(sorted.filter((key, index) => sorted[index-1] === key || sorted[index+1] === key));

}

/**
 * Qualifies the names programs share.
 *
 * A program superseded by a new ordinamento keeps its name, so the names stated by more than one program are qualified
 * with the academic year of the cohort the catalogue publishes each under, where known.
 *
 * @param programs The programs to qualify, along with the enrolment year of the cohort their catalogue page stands for
 *
 * @returns The programs, those sharing a name qualified with their cohort
 */
export function programs(programs: readonly {
	readonly draft: ProgramDraft,
	readonly cohort?: number
}[]): readonly ProgramDraft[] {

	const duplicates = shared(programs.map(({ draft }) => draft.name));

	return programs.map(({ draft, cohort }) => cohort !== undefined
		&& Object.entries(draft.name).some(([tag, label]) => duplicates.has(`${tag}:${label}`))
			? immutable({
				...draft,
				name: Object.fromEntries(Object.entries(draft.name).map(([tag, label]) =>
					[tag, `${label} (${academic(cohort)})`]
				))
			})
			: draft
	);

}

/**
 * Qualifies the names courses share.
 *
 * A name stated by more than one course is qualified with the name its program states in the same language, falling
 * back to the Italian one, so that courses taught under different programs stay apart.
 *
 * @param courses The courses to qualify
 * @param programs The programs the courses belong to
 *
 * @returns The courses, those sharing a name qualified with their program
 */
export function qualify(courses: readonly CourseDraft[], programs: readonly ProgramDraft[]): readonly CourseDraft[] {

	const duplicates = shared(courses.map(({ name }) => name));
	const index = new Map(programs.map(program => [program.key, program]));

	return courses.map(course => opt(
		course.inProgram?.map(({ key }) => index.get(key)).find(program => program !== undefined),
		program => Object.entries(course.name).some(([tag, label]) => duplicates.has(`${tag}:${label}`))
			? immutable({
				...course,
				name: Object.fromEntries(Object.entries(course.name).map(([tag, label]) => [tag, opt(
					program.name[tag] ?? program.name[pavia.locale],
					qualifier => `${label} (${qualifier})`
				) ?? label]))
			})
			: course
	) ?? course);

}
