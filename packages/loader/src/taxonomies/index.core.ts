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

import { taxonomies, Taxonomies, Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { memo } from "@metreeca/core";
import { by } from "@metreeca/core/order";
import type { Markdown, Text } from "@metreeca/core/strings";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { cosine, decompress, type Distance, type Vector } from "@metreeca/llms/vectors";
import { createGoogleAI, embedding } from "@metreeca/llms-google";
import { validate } from "@metreeca/mime-jsonld";
import { delta, lookup, settle } from "@metreeca/pipe-store";
import type { Reference } from "@metreeca/qest/state";
import { log, report, time } from "@metreeca/tape";
import { execute } from "../index.core.js";


const logger = log(import.meta.url);

const concepts = memo(async (id: Reference) => {

	const stored = await pipe(
		(lookup({

			entry: id,
			shape: Taxonomy,

			model: {

				resources: {
					id: {},
					prefLabel: { en: {} },
					altLabel: { en: {} },
					definition: { en: {} },
					broader: {},
					narrower: {},
					related: {},
					embedding: {}
				}

			}

		}))
		(toArray())
	);

	// linked concepts are named alongside their labels, so that a consumer weighs a concept against the neighbourhood
	// it stands in without looking every reference up

	const labels = new Map(stored.map(({ id, prefLabel }) => [id, prefLabel.en]));

	return stored.map(({ prefLabel, altLabel, definition, broader, narrower, related, embedding, ...concept }) => ({

		...concept,

		// concepts are weighed in English, the pivot language every event is translated into for classification

		prefLabel: prefLabel.en,

		// a property the concept states nothing for is left out of the model, rather than stated as an empty array

		altLabel: altLabel?.en ?? [],
		definition: definition?.en,

		broader: refs(broader),
		narrower: refs(narrower),
		related: refs(related),

		embedding: decompress(embedding)

	}));


	function refs(ids: undefined | readonly Reference[]): readonly TopicReference[] {
		return (ids ?? []).map(id => ({ id, prefLabel: labels.get(id) }));
	}

});


if ( import.meta.main ) {
	await execute(Metadata);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type ConceptMatch = ConceptEntry & {

	readonly distance: Distance

}

export type ConceptEntry = {

	readonly id: Reference

	readonly prefLabel: Text
	readonly altLabel: readonly Text[]
	readonly definition?: Markdown

	readonly broader: readonly TopicReference[]
	readonly narrower: readonly TopicReference[]
	readonly related: readonly TopicReference[]

}

export type TopicReference = {

	readonly id: Reference
	readonly prefLabel?: Text

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Metadata() {

	return pipe(
		(items([taxonomies]))
		(validate(Taxonomies))
		(map(catalogue => delta(taxonomies.id, Taxonomies, catalogue)))
		(settle({ atomic: true }))
	);

}


export async function getConceptEmbedding(text: Text): Promise<Vector> {

	const ai = service(createGoogleAI);

	if ( text.trim() === "" ) {
		throw new RangeError("expected non-blank text");
	}

	return time(embed, (vector, elapsed) => logger.info
		`embedded <${report(text.length)}> chars as <${report(vector.length)}> components in <${report(elapsed)}> ms`
	);

	async function embed() {
		return embedding(await ai.models.embedContent({

			model: "gemini-embedding-2",
			contents: text,

			config: {
				taskType: "CLASSIFICATION",
				outputDimensionality: 768
			}

		}));
	}

}

export async function getConceptMatches(taxonomy: Taxonomy, query: Text): Promise<readonly ConceptMatch[]> {

	const [vector, entries] = await Promise.all([

		getConceptEmbedding(query),
		concepts(taxonomy.id)

	]);

	return entries

		.map(({ embedding, ...concept }) => ({

			...concept,

			distance: cosine(vector, embedding)

		}))

		.sort(by(({ distance }) => distance));

}

export async function getConceptEntries(
	taxonomy: Taxonomy,
	selection?: readonly Reference[]
): Promise<readonly ConceptEntry[]> {

	return (await concepts(taxonomy.id))

		.filter(({ id, broader }) =>
			selection === undefined || selection.length === 0
				? broader.length === 0
				: selection.includes(id)
		)

		.sort(by(({ id }) => id))

		.map(({ embedding, ...record }) => record);

}
