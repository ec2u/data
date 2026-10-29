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
import { type Card, credits, period } from "./pavia-portal.core.js";


/**
 * The Italian names of the degrees awarded by the masters the catalogue lists, keyed by the type it lists them under.
 */
const Degrees: { readonly [type: string]: string } = {
	"Master 1° livello": "Master universitario di primo livello",
	"Master 2° livello": "Master universitario di secondo livello"
};


/**
 * Seeds a master the catalogue lists.
 *
 * The master is keyed by its page address and named in Italian as the catalogue lists it; it is stated at ISCED 2011
 * level 7, awarding the first or second level university master degree, along with the academic year, credits and
 * duration the catalogue states, facts the extraction from the master page never overrides.
 *
 * @param card The master as the catalogue lists it
 *
 * @returns The lead of the master, or `undefined` if the card lists no master or a blank name
 */
export function lead({ url, type, year, name, notes }: Card): Optional<Lead> {
	return opt(Degrees[type], degree => name.trim() === "" ? undefined : immutable({

		url,

		seed: immutable({

			kind: "program",

			university: pavia,
			key: url,
			...opt(year, year => ({ year })),

			name: { [pavia.locale]: name.trim() },
			url: [url],

			...opt(credits(notes), numberOfCredits => ({ numberOfCredits })),
			...opt(period(notes), timeToComplete => ({ timeToComplete })),

			educationalLevel: [getTopicId(isced2011, "7")],
			educationalCredentialAwarded: { credentialCategory: "Degree", name: { [pavia.locale]: degree } }

		})

	}));
}
