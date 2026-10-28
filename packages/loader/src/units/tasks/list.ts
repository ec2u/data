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

import { schema } from "@metreeca/blue";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string, url } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { assert, isDefined } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { getResource } from "@metreeca/gear/space";
import { createGoogleAI, json } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { fetchPage } from "../tools/fetchPage.js";


/**
 * A unit as a directory page lists it, along with the address of the page listing it.
 */
export type Listed = State<typeof Entry> & {

	readonly profile: string

}


function Directory() {
	return resource({

		name: "Unit Directory",
		description: "The research units a directory page of a university lists"

	}, {

		units: multiple(Entry)

	});
}

function Entry() {
	return resource({

		name: "Listed Unit",
		description: "A research unit as a directory page lists it"

	}, {

		formal: required(string, {
			name: "Formal Name",
			description: `
				The full official name of the research unit, not including its acronym: 'Laboratory for Computational
				Biology', not 'Laboratory for Computational Biology (LCB)'.
			`
		}),

		acronym: optional(string, {
			name: "Acronym",
			description: "The acronym or short form of the name, stated only where the source mentions it explicitly"
		}),

		website: optional(url, {
			name: "Website",
			description: "The complete address of the homepage of the research unit, stated only where available"
		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a unit directory reader.
 *
 * Lists every research unit each directory page names, exploring the pages it links to where the listing spreads over
 * them. The listing is the scan the units of a university are retracted against, so a page the model fails on is not
 * skipped: the failure ends the feed, and with it any retraction the run would otherwise state.
 *
 * @returns A task converting a feed of directory page addresses into a feed of the units they list
 *
 * @throws {@link !Error Error} While the feed is consumed, if the model fails on a directory page, or if it returns a
 * listing that does not conform to the expected shape of a directory, ending the run before any retraction
 */
export function list(): Task<string, Listed> {

	const ai = service(createGoogleAI);

	return directories => pipe(
		(items(directories))
		(flat(map(async directory => pipe(
			(items((await read(directory)).units))
			(validate(Entry)) // already accepted within the listing: types each entry rather than dropping any
			(map((entry): Listed => immutable({ ...entry, profile: directory })))
		))))
	);


	async function read(directory: string): Promise<State<typeof Directory>> {

		const payload = json(await ai.models.generateContent({

			model: "gemini-2.5-flash",

			contents: directory,

			config: {

				seed: 0,
				temperature: 0,

				systemInstruction: await getResource(".sys.md", import.meta.url),

				tools: [fetchPage()],

				responseMimeType: "application/json",
				responseJsonSchema: schema(Directory)

			}

		}));

		const [listing] = await pipe(
			(items([payload]))
			(validate(Directory))
			(toArray())
		);

		return assert(listing, isDefined, `malformed listing for <${directory}>`);

	}

}
