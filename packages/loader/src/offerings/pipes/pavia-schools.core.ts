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
import { type Card, period } from "./pavia-portal.core.js";


/**
 * Seeds a specialisation school the catalogue lists.
 *
 * The school is keyed by its page address and named in Italian as `Scuola di Specializzazione in` its listed name, in
 * sentence case if the catalogue lists it in capitals; it is stated at ISCED 2011 level 8, awarding the `Diploma di
 * Specializzazione` degree, along with the duration the catalogue states, facts the page extraction never overrides.
 *
 * @param card The school as the catalogue lists it
 *
 * @returns The lead of the school, or `undefined` if its name is blank
 */
export function lead({ url, name, notes }: Card): Optional<Lead> {

	const title = name === name.toLocaleUpperCase(pavia.locale)
		? `${name.charAt(0)}${name.slice(1).toLocaleLowerCase(pavia.locale)}`
		: name;

	return title.trim() === "" ? undefined : immutable({

		url,

		seed: immutable({

			kind: "program",

			university: pavia,
			key: url,

			name: { [pavia.locale]: `Scuola di Specializzazione in ${title.trim()}` },
			url: [url],

			...opt(period(notes), timeToComplete => ({ timeToComplete })),

			educationalLevel: [getTopicId(isced2011, "8")],
			educationalCredentialAwarded: { credentialCategory: "Degree", name: { [pavia.locale]: "Diploma di Specializzazione" } }

		})

	});

}
