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
import { poitiers } from "@ec2u/data-shared/universities/index.core.js";
import { opt, type Optional } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type ProgramDraft, sync } from "../sinks/sync.js";
import snapshot from "./poitiers.json" with { type: "json" };


const Source = resolve(base, "/offerings/poitiers");


const logger = log(import.meta.url);


/**
 * A program entry of the Poitiers catalogue snapshot.
 */
export type Entry = {

	readonly code: string
	readonly name: string

	readonly credits: number
	readonly levelISCED: number

	readonly composante: string
	readonly discipline: null | string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Poitiers);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the programs of the Poitiers catalogue snapshot.
 *
 * Reads the one-off extract of the Poitiers training offer bundled with the loader, keyed by program code, as no live
 * feed is available yet; courses are not ingested. The snapshot states no academic year, so the sink dates its programs
 * with the one current at retrieval, switching in August.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function Poitiers() {
	return pipe(
		(items(Object.values(snapshot)))
		(flat(map(read)))
		(sync(Source))
	);
}


function read(entry: Entry): readonly ProgramDraft[] {

	const draft = program(entry);

	if ( draft === undefined ) {

		logger.warning`malformed entry <${clip(JSON.stringify(entry), 100)}>`;

		return [];

	} else {

		return [draft];

	}

}


/**
 * Reads a program entry of the Poitiers catalogue snapshot.
 *
 * The program is keyed by its `code`, which it also states as its identifier, and named in French as `code - name`, so
 * that programs sharing a name stay apart. Its `levelISCED` is mapped to the ISCED 2011 taxonomy, its positive
 * `credits` stated as given and its `composante` named as its provider; its `discipline` is handed on as a cue for
 * classifying its field of education against ISCED-F 2013, the snapshot stating none.
 *
 * @param entry The program entry as the snapshot states it
 *
 * @returns The draft of the program, or `undefined` if the entry states no code or no name
 */
export function program({ code, name, credits, levelISCED, composante, discipline }: Entry): Optional<ProgramDraft> {

	const key = code.trim();
	const title = name.trim();

	return key === "" || title === "" ? undefined : immutable({

		kind: "program",

		university: poitiers,
		key,

		identifier: key,
		name: { [poitiers.locale]: `${key} - ${title}` },

		...(credits > 0 ? { numberOfCredits: credits } : {}),

		educationalLevel: Number.isInteger(levelISCED) && levelISCED >= 0 && levelISCED <= 9
			? [getTopicId(isced2011, String(levelISCED))]
			: [],

		...opt(composante.trim() || undefined, provider => ({ provider: { name: { [poitiers.locale]: provider } } })),
		...opt(discipline?.trim() || undefined, field => ({ cues: { field } }))

	});

}
