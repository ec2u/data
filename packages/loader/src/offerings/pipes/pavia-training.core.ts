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
import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { opt, type Optional } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import type { Lead } from "../sinks/crawl.js";
import { type Card, credits } from "./pavia-portal.core.js";


const Type = "Corso di perfezionamento";

/**
 * The ISO 639-1 tags of the teaching languages the catalogue states, keyed by their lowercase Italian name.
 */
const Languages: { readonly [name: string]: string } = {
	italiana: "it",
	inglese: "en"
};


/**
 * Seeds an advanced training course the catalogue lists.
 *
 * The course is keyed by its page address and named in Italian as the catalogue lists it; it is stated at ISCED 2011
 * level 7, awarding a certificate, along with the academic year, credits and main teaching language the catalogue
 * states, facts the extraction from the course page never overrides, whatever the page itself says.
 *
 * @param card The course as the catalogue lists it
 *
 * @returns The lead of the course, or `undefined` if the card lists no advanced training course or a blank name
 */
export function lead({ url, type, year, name, notes }: Card): Optional<Lead> {
	return type !== Type || name.trim() === "" ? undefined : immutable({

		url,

		seed: immutable({

			kind: "course",

			university: pavia,
			key: url,
			...opt(year, year => ({ year })),

			name: { [pavia.locale]: name.trim() },
			url: [url],

			...opt(credits(notes), numberOfCredits => ({ numberOfCredits })),

			inLanguage: notes.flatMap(note => opt(/^Lingua:.*?(\p{L}+)$/u.exec(note) ?? undefined, ([, language]) =>
				opt(Languages[language.toLowerCase()], tag => [tag])
			) ?? []),

			educationalLevel: [getTopicId(isced2011, "7")],
			educationalCredentialAwarded: { credentialCategory: "Certificate" }

		})

	});
}
