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
import { isArray, opt, type Optional } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, fork, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { xml, xpath, type XPath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type CourseDraft, type Draft, type ProgramDraft, sync } from "../sinks/sync.js";
import { courses, type OfferRecord, type Page, pages, program, programs, qualify } from "./pavia.core.js";


const Source = resolve(base, "/offerings/pavia");

const OfferURL = "https://studentionline.unipv.it/e3rest/api/offerta-service-v1/offerte/";

const PlanURL = "offerings-pavia-url";
const PlanUser = "offerings-pavia-usr";
const PlanPassword = "offerings-pavia-pwd";

const PageSize = 100; // the number of programs read from ESSE3 at a time

const retrieval = 10; // the number of programs harvested at the same time // !!! as option


const logger = log(import.meta.url);


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
 * load is logged and lists no course, leaving the retraction floor to keep the courses of failed plans from being
 * retracted wholesale. Programs and courses are linked to their catalogue pages where the catalogue confirms them, and
 * qualified as {@link programs} and {@link courses} describe, before being stated.
 *
 * @returns A promise resolving to a tally of what the run did
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

	const stated = programs(harvests.flatMap(({ program }) => program === undefined ? [] : [program]));
	const taught = qualify(harvests.flatMap(({ courses }) => courses), stated);

	return pipe(
		(items<Draft>([...stated, ...taught]))
		(sync(Source))
	);


	async function harvest(record: OfferRecord): Promise<{

		readonly program?: { readonly draft: ProgramDraft, readonly cohort?: number }
		readonly courses: readonly CourseDraft[]

	}> {

		const page = await first(pages(record));
		const draft = program(record, page?.url);

		const { cdsCod, aaOffId } = record;

		const plans = cdsCod !== undefined && cdsCod !== null && aaOffId !== undefined && aaOffId !== null
			? await teaching(cdsCod, aaOffId)
			: [];

		const located = await Promise.all(plans.flatMap(courses).map(async ({ draft, page }) =>
			page !== undefined && await resolves(page.probe) ? immutable({ ...draft, url: [page.url] }) : draft
		));

		if ( draft === undefined ) {
			logger.warning`malformed program <${cdsCod}>`;
		}

		return immutable({

			...opt(draft, draft => ({ program: { draft, ...opt(page?.cohort, cohort => ({ cohort })) } })),

			courses: located

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
async function listing(offer: number, start = 0): Promise<readonly OfferRecord[]> {

	const page = await pipe(
		(items([`${OfferURL}?aaOffId=${offer}&start=${start}&limit=${PageSize}`]))
		(fetch())
		(flat(map(async response => opt(await response.json(), (json: unknown) => isArray<OfferRecord>(json) ? json : []) ?? [])))
		(toArray())
	);

	return page.length < PageSize ? page : [...page, ...await listing(offer, start+PageSize)];

}

/**
 * Finds the first page the catalogue confirms.
 */
async function first<P extends Page>(pages: readonly P[]): Promise<Optional<P>> {
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
