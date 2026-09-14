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

import { synopsis } from "@/_/muse/index.js";
import { getTopicMatches, type Taxonomy } from "@/taxonomies/index.js";
import { events as eventTopics } from "@/taxonomies/pipes/events.core.js";
import { stakeholders as stakeholderTopics } from "@/taxonomies/pipes/stakeholders.core.js";
import type { Object } from "@metreeca/core";
import type { Text } from "@metreeca/core/strings";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import type { Reference } from "@metreeca/qest/resource";


const threshold = 0.6; // the largest distance a topic is accepted at, as tuned on the legacy pipeline // !!! as option


/**
 * Creates a task classifying extracted event properties.
 *
 * Each payload is answered with the topic and the stakeholder type it stands closest to, stated under `about` and
 * `audience`, so that a conversion states a classification without matching or embedding anything of its own. A
 * payload no topic stands close enough to is answered with none, rather than with the least distant one.
 *
 * The event is classified on its title and description taken together, as the page states them, so that a page saying
 * nothing about its topic is classified on what it is about rather than left unclassified.
 *
 * Both taxonomies are read on the first payload they classify and held afterwards, so a taxonomy edited during a run
 * is taken up by a later one.
 *
 * @returns A task answering a feed of extracted property payloads with the same payloads, classified
 *
 * @throws {@link !Error Error} If no execution is running, as the store and the embedder are resolved from the
 * enclosing one
 */
export function classify(): Task<Object, Object> {

	return map(async payload => {

		if ( payload.event !== true ) { // a payload stating no event is dropped downstream, so it is not embedded

			return payload;

		} else {

			const query = synopsis(
				payload.title as undefined | string,
				payload.description as undefined | string
			);

			const [about, audience] = await Promise.all([
				match(eventTopics, query),
				match(stakeholderTopics, query)
			]);

			return {

				...payload,

				about,
				audience

			};

		}

	});


	async function match(taxonomy: Taxonomy, query: Text): Promise<readonly Reference[]> {
		return (await getTopicMatches(taxonomy, query))
			.filter(({ distance }) => distance <= threshold)
			.slice(0, 1)
			.map(({ id }) => id);
	}

}
