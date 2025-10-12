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

import { Lead } from "@/pipelines/units/index";
import { immutable } from "@/utilities/core";
import { log, message, time } from "@/utilities/core/log";
import { datastore } from "@/utilities/gcp/datatsore";
import { uuid } from "@/utilities/node/uuid";


const kind="Lead";
const batch=100;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const leads=immutable({

	async lookup({ offset, limit }: {

		readonly offset?: number;
		readonly limit?: number;

	}={}): Promise<readonly Lead[]> {

		return time(async () => {

				let query=datastore.createQuery(kind);

				if ( offset ) {
					query=query.offset(offset);
				}

				if ( limit ) {
					query=query.limit(limit);
				}

				const [entities]=await datastore.runQuery(query);

				return entities.map(({ [datastore.KEY]: _, ...lead }) => lead);

			}, (value, elapsed) => log.info(leads.lookup.name,
				`retrieved <${message(value.length)}> leads in <${message(elapsed)}> ms`
			)
		);

	},

	async insert(items: readonly Lead[]): Promise<readonly Lead[]> {

		return time(async () => {

				for (let i=0; i < items.length; i+=batch) {

					await datastore.upsert(items.slice(i, i+batch)
						.filter(lead => lead.id || lead.profile || lead.website)
						.map(lead => ({
							key: datastore.key([kind, uuid(lead.id ?? lead.profile ?? lead.website!)]),
							data: lead,
							excludeFromIndexes: ["summary"]
						})));
				}

				return items;

			}, (value, elapsed) => log.info(leads.insert.name,
				`inserted <${message(value.length)}> leads in <${message(elapsed)}> ms`
			)
		);

	}

});
