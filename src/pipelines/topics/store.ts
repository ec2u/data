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

import { Topic } from "@/pipelines/topics/index";
import { compress, decompress } from "@/utilities/ai/embeddings";
import { immutable } from "@/utilities/core";
import { log, message, time } from "@/utilities/core/log";
import { datastore } from "@/utilities/gcp/datatsore";
import { uuid } from "@/utilities/node/uuid";
import { PropertyFilter } from "@google-cloud/datastore";


const kind="Topic";
const batch=100;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const topics=immutable({

	async select({

		scheme

	}: {

		scheme?: string

	}={}): Promise<readonly Topic[]> {

		return time(async () => {

			let query=datastore.createQuery(kind).order("__key__");

				if ( scheme ) {
					query=query.filter(new PropertyFilter("scheme", "=", scheme));
				}

				const [entities]=await datastore.runQuery(query);

				return entities.map(({ [datastore.KEY]: _, embedding, ...topic }) => ({
					...topic,
					embedding: decompress(embedding as string)
				}));

			}, (value, elapsed) => log.info(topics.select.name,
				`retrieved <${message(value.length)}> topics${(scheme ? ` from <${scheme}>` : "")} in <${message(elapsed)}> ms`
			)
		);

	},

	async insert(items: readonly Topic[]): Promise<readonly Topic[]> {

		return time(async () => {

			const indexed=new Set(["scheme"]);

			for (let i=0; i < items.length; i+=batch) {

				await datastore.upsert(items.slice(i, i+batch).map(({ embedding, ...topic }) => {

					const data={ ...topic, embedding: compress(embedding) };

					return {
						key: datastore.key([kind, uuid(topic.id)]),
						data,
						excludeFromIndexes: Object.keys(data).filter(field => !indexed.has(field))
					};

				}));
			}

			return items;

		}, (value, elapsed) => log.info(topics.insert.name,
			`inserted <${message(value.length)}> topics in <${message(elapsed)}> ms`
		));

	}

});
