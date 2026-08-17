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

import { index, Topic } from "@/datasets/topics/index.js";
import { topics } from "@/datasets/topics/store.js";
import { hub } from "@/utilities/hub/index.js";
import { sparql } from "@/_/core/tags.js";
import type { Term } from "@rdfjs/types";


if ( import.meta.main ) {
	extract("https://data.ec2u.eu/taxonomies/organizations/").then(topics.insert);
	extract("https://data.ec2u.eu/taxonomies/euroscivoc/").then(topics.insert);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function extract(scheme: string): Promise<readonly Topic[]> {

	return Array.fromAsync(
			hub.query.select(sparql`

                prefix skos: <http://www.w3.org/2004/02/skos/core#>

                select * where {

                    values ?scheme {
                        <${scheme}>
                    }

                    ?topic a skos:Concept ;
                        skos:inScheme ?scheme ;
                        skos:prefLabel ?label .

                    filter (lang(?label) = 'en')

                    optional {

                        ?topic skos:definition ?definition

                        filter (lang(?definition) = 'en')

                    }

                    optional {

                        ?topic skos:broader ?broader

                    }
                }

			`), (row: Record<string, Term>) => ({
				id: row.topic?.value,
				label: row.label?.value,
				definition: row.definition?.value,
				scheme,
				broader: row.broader?.value
			})
		)

		.then(topics => {

			const broaders = new Map(topics.map(t => [t.id, t.broader]));

			const lineage = (id: undefined | string): readonly string[] => {
				return !id ? [] : [...lineage(broaders.get(id)), id];
			};

			return topics.map(topic => ({
				...topic, lineage: lineage(topic.id)
			}));

		})

		.then(async topics => Promise.all(
			topics.map(async topic => ({
				...topic, embedding: await index(`${topic.label} / ${topic.definition}`)
			}))
		))

		.then(topics =>
			topics as readonly Topic[]
		);
}
