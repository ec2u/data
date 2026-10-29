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
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { jena } from "@ec2u/data-shared/universities/index.core.js";
import { isObject, isString, opt } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { distinct, flat, fork, map } from "@metreeca/flow/tasks";
import { html, link, unwrap, xpath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type Dictionary, type ProgramDraft, sync } from "../sinks/sync.js";


const Source = resolve(base, "/offerings/jena");

const CatalogueURL = "https://www.uni-jena.de/en/study-programme";

const retrieval = 10; // the number of pages fetched at the same time from the source site // !!! as option

/**
 * The ISCED 2011 levels of the degrees the catalogue names.
 */
const Levels: { readonly [degree: string]: string } = {
	"Bachelor of Arts": "6",
	"Bachelor of Science": "6",
	"Master of Arts": "7",
	"Master of Education": "7",
	"Master of Science": "7",
	"state examination": "9",
	"Diploma/church board examination": "9"
};


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Jena);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the degree programs listed by the Jena study programme catalogue.
 *
 * Reads the program pages the catalogue links from its filterable list, then the `AboutPage` structured data each page
 * embeds as JSON-LD, as {@link program} describes. A listed page that fails to load fails the run before anything is
 * stated, so its program is never retracted on the strength of a failed request; a page embedding no usable structured
 * data is logged and dropped, its program being retracted as no longer described.
 *
 * @returns A promise resolving to a tally of what the run did
 *
 * @throws {@link !Error Error} If a listed program page fails to load
 */
export async function Jena() {

	const links = await pipe(
		(items([CatalogueURL]))
		(fetch())
		(html())
		(xpath())
		(flat(map(path => path("//li[@data-filter]/a/@href").map(link))))
		(distinct())
		(toArray())
	);

	const pages = await pipe(
		(items(links))
		(fork(retrieval, links => pipe(
			(items(links))
			(map(async url => immutable({ url, values: await embedded(url) })))
		)))
		(toArray())
	);

	const failed = pages.filter(({ values }) => values === undefined).length;

	if ( failed > 0 ) {

		throw new Error(`failed program pages <${failed}>`);

	} else {

		return pipe(
			(items(pages))
			(flat(map(({ url, values = [] }) => read(values, url))))
			(sync(Source))
		);

	}

}


function read(values: readonly unknown[], url: string): readonly ProgramDraft[] {

	const draft = program(values, url);

	if ( draft === undefined ) {

		logger.warning`no structured data at <${url}>`;

		return [];

	} else {

		return [draft];

	}

}


/**
 * Reads the JSON-LD values a page embeds, or nothing if the page fails to load.
 */
async function embedded(url: string): Promise<undefined | readonly unknown[]> {

	const lists = await pipe(
		(items([url]))
		(fetch())
		(html())
		(unwrap())
		(toArray())
	);

	return lists.length === 0 ? undefined : lists.flat();

}


/**
 * Reads the program a page states in its embedded JSON-LD.
 *
 * Picks the `AboutPage` among the values the page embeds: the program is keyed by the page address the catalogue
 * links, named by the `headline` and described by the `abstract`, in the language `inLanguage` names, English by
 * default. Its `educationalLevel`, a degree name such as `Master of Science`, is stated as the degree awarded and
 * mapped to an ISCED 2011 level where the degree is known, the classification filling the level in otherwise.
 *
 * @param values The JSON-LD values the page embeds
 * @param url The address of the page, as the catalogue links it
 *
 * @returns The draft of the program, or `undefined` if the page embeds no `AboutPage` stating a headline
 */
export function program(values: readonly unknown[], url: string): undefined | ProgramDraft {

	const page = values.find(value => isObject(value) && value["@type"] === "AboutPage");

	if ( !isObject(page) ) {

		return undefined;

	} else {

		const locale = opt(text(page.inLanguage), tag => opt(/^([a-z]{2})(-|$)/i.exec(tag) ?? undefined, ([, language]) =>
			language.toLowerCase()
		)) ?? "en";

		const local = (value: unknown): undefined | Dictionary => opt(text(value), value => ({ [locale]: value }));
		const degree = text(page.educationalLevel);

		return opt(local(page.headline), name => immutable({

			kind: "program",

			university: jena,
			key: url,

			name,
			...opt(local(page.abstract), description => ({ description })),
			url: [url],

			educationalLevel: [opt(degree, degree => Levels[degree])]
				.flatMap(level => level === undefined ? [] : [getTopicId(isced2011, level)]),

			...opt(degree, degree => ({
				educationalCredentialAwarded: credential({ [locale]: degree })
			}))

		}));

	}

}


/**
 * States a degree as the credential a program awards.
 */
function credential(name: Dictionary): NonNullable<ProgramDraft["educationalCredentialAwarded"]> {
	return immutable({ credentialCategory: "Degree", name });
}

function text(value: unknown): undefined | string {
	return isString(value) && value.trim() !== "" ? value.trim() : undefined;
}
