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

import { createEmbedder, embeddable, type Embedding, type Index } from "@/_/muse/embedder/index.js";
import { getTaxonomyIndex } from "@/taxonomies/index.js";
import { events as eventTopics } from "@/taxonomies/pipes/events.core.js";
import { stakeholders as stakeholderTopics } from "@/taxonomies/pipes/stakeholders.core.js";
import type { Object } from "@metreeca/core";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
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
 * Both taxonomies are retrieved once, as the first payload is classified, and held for the run.
 *
 * @returns A task answering a feed of extracted property payloads with the same payloads, classified
 *
 * @throws {@link !Error Error} If no execution is running, as the store and the embedder are resolved from the
 * enclosing one
 */
export function classify(): Task<Object, Object> {

	const embedder = service(createEmbedder);

	let taxonomies: undefined | Promise<{ // indexed as the first event is classified and held for the run

		readonly about: Index<Reference>;
		readonly audience: Index<Reference>;

	}>;

	return map(async payload => {

		if ( payload.event !== true ) { // a payload stating no event is dropped downstream, so it is not embedded

			return payload;

		} else {

			if ( taxonomies === undefined ) {
				taxonomies = Promise.all([index(eventTopics.id), index(stakeholderTopics.id)])
					.then(([about, audience]) => ({ about, audience }));
			}

			const { about, audience } = await taxonomies;

			const embedding = await embedder(embeddable(
				payload.title as undefined | string,
				payload.description as undefined | string
			));

			return {

				...payload,

				about: closest(embedding, about),
				audience: closest(embedding, audience)

			};

		}

	});


	async function index(taxonomy: Reference): Promise<Index<Reference>> {

		return await getTaxonomyIndex(taxonomy, {

			threshold,
			limit: 1

		});

	}

	function closest(embedding: Embedding, index: Index<Reference>): readonly Reference[] {

		return index(embedding).map(([id]) => id);

	}

}
