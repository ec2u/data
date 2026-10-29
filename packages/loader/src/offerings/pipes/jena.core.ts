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
import { jena } from "@ec2u/data-shared/universities/index.core.js";
import { isObject, opt, type Optional, type Value } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import type { ProgramDraft } from "../sinks/sync.js";


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


/**
 * The `AboutPage` a program page embeds as JSON-LD.
 */
export type AboutPage = {

	readonly "@type": "AboutPage"

	readonly headline?: null | string
	readonly abstract?: null | string
	readonly inLanguage?: null | string
	readonly educationalLevel?: null | string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
export function program(values: readonly Value[], url: string): Optional<ProgramDraft> {
	return opt(values.find(isAboutPage), ({ headline, abstract, inLanguage, educationalLevel }) => {

		const locale = /^([a-z]{2})(-|$)/i.exec(inLanguage?.trim() ?? "")?.[1]?.toLowerCase() ?? "en";
		const description = abstract?.trim() || undefined;
		const credential = educationalLevel?.trim() || undefined;

		return opt(headline?.trim() || undefined, name => immutable({

			kind: "program",

			university: jena,
			key: url,

			name: { [locale]: name },
			...opt(description, description => ({ description: { [locale]: description } })),
			url: [url],

			educationalLevel: opt(credential, credential => opt(Levels[credential], level =>
				[getTopicId(isced2011, level)]
			)) ?? [],

			...opt(credential, credential => ({
				educationalCredentialAwarded: { credentialCategory: "Degree", name: { [locale]: credential } }
			}))

		}));

	});
}


function isAboutPage(value: Value): value is AboutPage {
	return isObject(value) && value["@type"] === "AboutPage";
}
