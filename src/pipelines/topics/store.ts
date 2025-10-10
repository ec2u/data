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

import { compress, decompress } from "@/pipelines/topics/embeddings";
import { Topic } from "@/pipelines/topics/index";
import { log, message, time } from "@/utilities/core/log";
import { datastore } from "@/utilities/gcp/datatsore";
import { hash } from "@/utilities/node/hash";
import { PropertyFilter } from "@google-cloud/datastore";


const Topic="Topic";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function store(topics: readonly Topic[]): Promise<readonly Topic[]> {

	const BATCH_SIZE=100;

	for (let i=0; i < topics.length; i+=BATCH_SIZE) {

		await datastore.upsert(topics.slice(i, i+BATCH_SIZE).map(({ embedding, ...topic }) => ({
			key: datastore.key([Topic, hash(topic.id)]),
			data: { ...topic, embedding: compress(embedding) },
			excludeFromIndexes: ["definition", "embedding"]
		})));
	}

	return topics;

}

export async function topics(scheme: string): Promise<readonly Topic[]> {
	return time(async () => {

			const query=datastore
				.createQuery(Topic)
				.filter(new PropertyFilter("scheme", "=", scheme));

			const [entities]=await datastore.runQuery(query);

			return entities.map(({ [datastore.KEY]: _, embedding, ...topic }) => ({
				...topic,
				embedding: decompress(embedding as string)
			} as Topic));

		}, (value, elapsed) => log.info(topics.name,
			`loaded <${message(value.length)}> topics from <${scheme}> in <${message(elapsed)}> ms`)
	);
}
