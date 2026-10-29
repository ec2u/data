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

import { coimbra } from "@ec2u/data-shared/universities/index.core.js";
import { isAny, isArray, isObject, isString, key, opt } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { distinct, flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type Draft, sync } from "../sinks/sync.js";


const DataURL = "units-coimbra-url";
const DataKey = "units-coimbra-key";

const EmailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;


const logger = log(import.meta.url);


/**
 * A research unit as the Coimbra units API describes it.
 *
 * Every field is always stated, as a string left empty where the unit has no value for it, and the head is named both
 * whole and split into its parts, the parts being stored under each other's field names.
 */
type Listed = {

	readonly id: string

	readonly name_en: string
	readonly name_pt: string
	readonly acronym_en: string
	readonly acronym_pt: string

	readonly description_en: string
	readonly description_pt: string

	readonly web_url: string
	readonly email: string

	readonly type_en: string
	readonly knowledge_branch_en: string
	readonly topics: readonly { readonly name_en: string }[]

	/**
	 * The given name of the head, despite the field name.
	 */
	readonly surname: string

	/**
	 * The family name of the head, despite the field name.
	 */
	readonly forename: string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Coimbra);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Coimbra() {

	const vault = service(createVault);

	return pipe(
		(items(new Request(await vault(DataURL), { headers: { Key: await vault(DataKey) } })))
		(records())
		(sync(coimbra))
	);

}


/**
 * Creates a reader of the research units listed by the Coimbra units API.
 *
 * Retrieves each listing and reads it as a JSON array, one unit draft per unit, keyed by its identifier in the API. The
 * listing repeats every unit several times over, so each unit is stated once. Names and descriptions are stated in
 * English and Portuguese where given, and the acronym, the website, the email address and the head are carried over;
 * the API swaps the `forename` and `surname` fields, as the full `head` name shows, so they are read the other way
 * round. Every unit stands directly under the university. The unit type, the knowledge branch and the topics are handed
 * on unchanged, as cues guiding the classification against the EC2U organisation taxonomy and EuroSciVoc.
 *
 * A listing that fails to be retrieved, or that answers with anything other than an array, as the API does to report
 * an error, yields no drafts at all; a unit stating any malformed fact is logged and dropped.
 *
 * @returns A task converting a feed of API requests into a feed of unit drafts
 */
function records(): Task<Request, Draft> {

	return requests => pipe(
		(items(requests))
		(fetch())
		(flat(map(async response => {

			const json: unknown = await response.json();

			if ( isArray(json) ) {

				return json.filter((record): record is Listed => {

					if ( isListed(record) ) {

						return true;

					} else {

						logger.warning`malformed unit <${JSON.stringify(record)}>`;

						return false;

					}

				});

			} else {

				logger.error`unexpected response <${JSON.stringify(json)}>`;

				return [];

			}

		})))
		(distinct(({ id }) => id))
		(map(draft))
	);


	function draft({

		id,

		name_en,
		name_pt,
		acronym_en,
		acronym_pt,

		description_en,
		description_pt,

		web_url,
		email,

		type_en,
		knowledge_branch_en,
		topics,

		surname: givenName,
		forename: familyName

	}: Listed): Draft {

		const definition = localised(description_en, description_pt);
		const cues = [knowledge_branch_en, ...topics.map(({ name_en }) => name_en)].map(text).flatMap(multiple);

		return immutable({

			id,

			identifier: id,

			prefLabel: localised(name_en, name_pt),
			altLabel: text(acronym_en) ?? text(acronym_pt),
			definition: Object.keys(definition).length === 0 ? undefined : definition,

			homepage: [url(web_url)].flatMap(multiple),
			mbox: [opt(text(email), email => EmailPattern.test(email) ? email : undefined)].flatMap(multiple),

			unitOf: [],
			institutes: [],

			heads: opt(text(givenName), givenName => opt(text(familyName), familyName => [{ givenName, familyName }])) ?? [],

			cues: {
				type: text(type_en),
				topics: cues.length === 0 ? undefined : cues.join("; ")
			}

		});

	}


	function isListed(value: unknown): value is Listed {
		return isObject(value, {
			id: isString,
			name_en: isString,
			name_pt: isString,
			acronym_en: isString,
			acronym_pt: isString,
			description_en: isString,
			description_pt: isString,
			web_url: isString,
			email: isString,
			type_en: isString,
			knowledge_branch_en: isString,
			topics: topics => isArray(topics, topic => isObject(topic, { name_en: isString, [key]: isAny })),
			surname: isString,
			forename: isString,
			[key]: isAny
		});
	}

	function localised(english: string, local: string) {

		const entries: readonly (readonly [string, undefined | string])[] = [
			["en", text(english)],
			[coimbra.locale, text(local)]
		];

		return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry[1] !== undefined));

	}

	function text(value: string): undefined | string {

		// runs of whitespace collapse to a single space, so the API's stray double spaces never reach the store

		const normalised = value.replace(/\s+/g, " ").trim();

		return normalised === "" ? undefined : normalised;

	}

	function url(value: string): undefined | string {
		return opt(text(value), value => URL.canParse(value)
			? opt(new URL(value), ({ protocol, href }) => protocol === "http:" || protocol === "https:" ? href : undefined)
			: undefined
		);
	}

}
