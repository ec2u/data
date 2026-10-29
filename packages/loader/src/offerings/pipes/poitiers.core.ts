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
import { poitiers } from "@ec2u/data-shared/universities/index.core.js";
import { opt, type Optional } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import type { ProgramDraft } from "../sinks/sync.js";


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
