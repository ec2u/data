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

import type { Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { iscedf2013 } from "@ec2u/data-shared/taxonomies/isced-f-2013.js";
import { schema } from "@metreeca/blue";
import { multiple, resource } from "@metreeca/blue/resource";
import { iri } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import type { Optional } from "@metreeca/core";
import { markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import type { Reference } from "@metreeca/qest/state";
import { log, report } from "@metreeca/tape";
import { getTopicEntries } from "../../taxonomies/index.core.js";
import { browseTopics } from "../../taxonomies/tools/browseTopics.js";
import { searchTopics } from "../../taxonomies/tools/searchTopics.js";
import type { Dictionary, Draft, Entry } from "../sinks/sync.js";


const logger = log(import.meta.url);

const tools = [
	searchTopics(isced2011, iscedf2013),
	browseTopics(isced2011, iscedf2013)
];


function Reported() {
	return resource({

		name: "Offering Topics",
		description: "The ISCED topics a single educational offering is tagged with"

	}, {

		level: multiple(iri, {
			name: "Level",
			description: `
				The identifier of at most one topic from <${isced2011.id}> naming the educational level of the offering,
				empty where none applies; only identifiers read from a tool response, copied exactly.
			`
		}),

		field: multiple(iri, {
			name: "Field",
			description: `
				The identifier of at most one topic from <${iscedf2013.id}> naming the field of education of the
				offering, empty where none applies; only identifiers read from a tool response, copied exactly.
			`
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an offering classifier.
 *
 * Tags each draft stating no educational level with one from ISCED 2011, and each draft stating no field of education
 * with one from ISCED-F 2013, reading its English name, summary, description and contents along with the level and
 * field the source states in its own words; topics the source states are kept as they are, and a draft stating both
 * passes through untouched, while a draft given any topic is flagged as generated. Only topics the taxonomies hold are
 * stated, each chain cut to its most specific member. A draft the model fails on is logged and dropped rather than
 * handed on untagged, and records no digest downstream, so that it is classified again on the next run, while the
 * offering the store holds for it stays exactly as the last successful run stated it, topics and flag included.
 *
 * @returns A task completing the educational level and field of a feed of draft entries
 */
export function classify(): Task<Entry, Entry> {

	const ai = service(createGoogleAI);

	return entries => pipe(
		(items(entries))
		(flat(map(async entry => {

			const { draft } = entry;

			const level = draft.educationalLevel ?? [];
			const field = (draft.about ?? []).filter(id => id.startsWith(`${iscedf2013.id}/`));

			return level.length > 0 && field.length > 0 ? [entry] : pipe(
				(items(await tag(draft)))
				(validate(Reported))
				(map(async tagged => {

					const levels = level.length > 0 ? [] : (await known(isced2011, tagged.level)).slice(0, 1);
					const fields = field.length > 0 ? [] : (await known(iscedf2013, tagged.field)).slice(0, 1);

					return immutable({

						...entry,

						draft: immutable({

							...draft,

							// topics added by the model mark the offering as generated

							...(levels.length > 0 || fields.length > 0 ? { generated: true } : {}),

							educationalLevel: [...level, ...levels],
							about: [...(draft.about ?? []), ...fields]

						})

					});

				}))
			);

		})))
	);


	async function tag({

		key,
		name,
		disambiguatingDescription,
		description,
		teaches,
		cues

	}: Draft): Promise<readonly State<typeof Reported>[]> {
		try {

			return [json<State<typeof Reported>>(await ai.models.generateContent({

				model: "gemini-3.6-flash",

				contents: markdown`
					- name: ${english(name)}
					- summary: ${english(disambiguatingDescription)}
					- description: ${english(description)}
					- contents: ${english(teaches)}
					- stated level: ${cues?.level ?? ""}
					- stated field: ${cues?.field ?? ""}
				`,

				config: {

					seed: 0,
					temperature: 0,

					systemInstruction: await getResource(".sys.md", import.meta.url),

					tools,

					automaticFunctionCalling: {
						maximumRemoteCalls: 50
					},

					responseMimeType: "application/json",
					responseJsonSchema: schema(Reported)

				}

			}))];

		} catch ( error ) {

			logger.error`failed to classify <${key}>: ${report(error)}`;

			return [];

		}
	}

	function english(text: Optional<Dictionary>): string {
		return text?.en ?? Object.values(text ?? {})[0] ?? "";
	}

	async function known(taxonomy: Taxonomy, ids: readonly Reference[] = []): Promise<readonly Reference[]> {

		const topics = new Set((await getTopicEntries(taxonomy, ids)).map(({ id }) => id));

		const stated = ids.filter(id => {

			if ( topics.has(id) ) {

				return true;

			} else {

				logger.warning`unknown topic <${id}> for taxonomy <${taxonomy.id}>`;

				return false;

			}

		});

		// a topic standing above another stated topic adds nothing a filter on the narrower one wouldn't find, so each
		// chain is cut to its most specific member; topic identifiers are slash-separated paths along the hierarchy of
		// their taxonomy, so standing above another topic is no more than a prefix test on the two identifiers

		return stated.filter(id => !stated.some(other => other.startsWith(`${id}/`)));

	}

}
