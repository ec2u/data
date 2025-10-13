/*
 * Copyright © 2025 Metreeca srl
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

import { Lead } from "@/pipelines/units";
import { sparql } from "@/utilities/core/tags";
import { hub } from "@/utilities/hub";
import type { Term } from "@rdfjs/types";

export async function bootstrap(university: string): Promise<readonly Lead[]> {
	return Array.fromAsync(
		hub.query.select(sparql`

            prefix foaf: <http://xmlns.com/foaf/0.1/>
            prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            prefix ec2u: <https://data.ec2u.eu/terms/>

            select * where {

                values ?university {
                    <${university}>
                }

                ?unit a ec2u:Unit ;
                    ec2u:university ?university .

                optional {
                    ?unit foaf:homepage ?homepage
                }

                optional {
                    ?unit rdfs:label ?label
                    filter (lang(?label) = 'en')
                }
                optional {
                    ?unit rdfs:comment ?comment
                    filter (lang(?comment) = 'en')
                }

            }

		`), (record: Record<string, Term>) => ({
			id: record.unit?.value,
			website: record.homepage?.value,
			name: record.label?.value,
			summary: record.comment?.value
		})
	);
}
