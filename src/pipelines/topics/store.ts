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

import { embedding } from "@/pipelines/topics/embeddings";
import { Topic } from "@/pipelines/topics/index";
import { log } from "@/utilities/core/log";
import { sparql } from "@/utilities/core/tags";
import { datastore } from "@/utilities/gcp/datatsore";
import { secret } from "@/utilities/gcp/secrets";
import { hash } from "@/utilities/node/hash";
import { PropertyFilter } from "@google-cloud/datastore";
import type { Term } from "@rdfjs/types";
import SparqlClient from "sparql-http-client";


async function data() {
	return new SparqlClient({
		endpointUrl: "https://graphdb.ec2u.net/repositories/data-main",
		user: await secret("gdb-server-usr"),
		password: await secret("gdb-server-pwd")
	});
}

const Topic="Topic";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function store(scheme: string) {

	const client=await data();

	new Promise<Partial<Topic>[]>((resolve, reject) => {

		const results: Partial<Topic>[]=[];

		client.query.select(sparql`
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
			`)

			.on("data", (row: Record<string, Term>) => results.push({
				id: row.topic?.value,
				label: row.label?.value,
				definition: row.definition?.value,
				scheme,
				broader: row.broader?.value
			}))
			.on("end", () => resolve(results))
			.on("error", reject);
	})

		.then(topics => {

			const broaders=new Map(topics.map(t => [t.id, t.broader]));

			const lineage=(id: undefined | string): readonly string[] => {
				return !id ? [] : [...lineage(broaders.get(id)), id];
			};

			return topics.map(topic => ({
				...topic, lineage: lineage(topic.id)
			}));

		})

		.then(async topics => Promise.all(
			topics.map(async topic => ({
				...topic, embedding: await embedding(`${topic.label} / ${topic.definition}`)
			}))
		))

		.then(topics =>
			topics as readonly Topic[]
		)

		.then(async topics => {

			const BATCH_SIZE=100;

			for (let i=0; i < topics.length; i+=BATCH_SIZE) {

				await datastore.upsert(topics.slice(i, i+BATCH_SIZE).map(({ embedding, ...topic }) => ({
					key: datastore.key([Topic, hash(topic.id)]),
					data: { ...topic, embedding: compress(embedding) },
					excludeFromIndexes: ["definition", "embedding"]
				})));
			}

			return topics;

		});
}

export async function topics(scheme: string): Promise<readonly Topic[]> {

	const start=Date.now();

	const query=datastore
		.createQuery(Topic)
		.filter(new PropertyFilter("scheme", "=", scheme));

	const [entities]=await datastore.runQuery(query);

	const result=entities.map(({ [datastore.KEY]: _, embedding, ...topic }) => ({
		...topic,
		embedding: decompress(embedding as string)
	} as Topic));

	log.info(topics.name, `loaded <${result.length.toLocaleString("en-US")}> topics from <${scheme}> in <${(Date.now()-start).toLocaleString("en-US")}> ms`);

	return result;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Compresses an embedding vector to base64-encoded 16-bit quantized representation.
 *
 * <p>Reduces storage size by ~75% compared to JSON array representation,
 * converting 64-bit floats to 16-bit integers with negligible precision loss
 * for cosine similarity calculations.</p>
 *
 * <p>Values are scaled to the int16 range [-32768, 32767] and rescaled on decompression.
 * This quantization preserves relative distances well for semantic similarity tasks.</p>
 *
 * @param embedding the embedding vector to compress
 *
 * @return base64-encoded binary representation of the quantized embedding
 */
function compress(embedding: readonly number[]): string {

	const int16Array=new Int16Array(embedding.length);

	for (let i=0; i < embedding.length; i++) {
		int16Array[i]=Math.round(embedding[i]*32767);
	}

	const buffer=Buffer.from(int16Array.buffer);

	return buffer.toString("base64");
}

/**
 * Decompresses a base64-encoded 16-bit quantized embedding to a float vector.
 *
 * @param compressed the base64-encoded compressed embedding
 *
 * @return the decompressed embedding vector
 */
function decompress(compressed: string): readonly number[] {

	const buffer=Buffer.from(compressed, "base64");

	const int16Array=new Int16Array(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength/Int16Array.BYTES_PER_ELEMENT
	);

	return Array.from(int16Array, v => v/32767);
}
