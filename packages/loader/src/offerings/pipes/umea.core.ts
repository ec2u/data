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

import { umea } from "@ec2u/data-shared/universities/index.core.js";
import { immutable } from "@metreeca/core/values";
import { isHTTP } from "@metreeca/work/core/resources.js";
import type { Lead } from "../sinks/crawl.js";
import type { Draft } from "../sinks/sync.js";


/**
 * A response of the Umeå search API.
 */
export type Results = {

	readonly hits: readonly {

		readonly url?: null | string

	}[]

}


/**
 * Reads the leads a search API response lists.
 *
 * Every hit with a web address names one offering of `kind`, keyed by its page address and seeded with nothing else.
 *
 * @param results The search API response
 * @param kind The kind of offering the response lists
 *
 * @returns The leads the response lists, in order of first mention
 */
export function leads(results: Results, kind: Draft["kind"]): readonly Lead[] {

	const urls = results.hits.map(({ url }) => url?.trim() ?? "").filter(isHTTP);

	return [...new Set(urls)].map(url => immutable({
		url,
		seed: kind === "program"
			? { kind: "program", university: umea, key: url, name: {} }
			: { kind: "course", university: umea, key: url, name: {} }
	}));

}
