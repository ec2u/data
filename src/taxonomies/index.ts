/*
 * Copyright © 2025-2026 Metreeca srl
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

import { memoize } from "@/_/core/memoize.js";
import { createStore } from "@/_/tide-store/index.js";
import { createGoogleAI, embedding } from "@/_/muse-google/index.js";
import { cosine, decompress, type Distance, type Vector } from "@/_/muse/index.js";
import { Dataset, Resource } from "@/datasets/index.js";
import { ec2u } from "@/vocabularies/ec2u.js";
import { SKOSConcept, SKOSConceptScheme } from "@/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import { by } from "@metreeca/core/order";
import type { Markdown, Text } from "@metreeca/core/strings";
import { service } from "@metreeca/gear";
import type { Reference } from "@metreeca/qest/resource";
import { log, report, time } from "@metreeca/tape";


const logger = log(import.meta.url);


const taxonomies = memoize(async (id: Reference) => {

	const store = service(createStore);

	const topics = await store.lookup({ // !!! replace with select

		entry: id,
		shape: Taxonomy,

		model: {

			resources: [{
				id: "",
				prefLabel: "",
				altLabel: [""],
				definition: "",
				broader: [""],
				narrower: [""],
				related: [""],
				embedding: ""
			}]

		}

	});

	const stated = topics?.resources ?? [];

	// linked topics are named alongside their labels, so that a consumer weighs a topic against the neighbourhood it
	// stands in without looking every reference up

	const labels = new Map(stated.map(({ id, prefLabel }) => [id, prefLabel]));

	return stated.map(({ altLabel, broader, narrower, related, embedding, ...topic }) => ({

		...topic,

		// a property the topic states nothing for is left out of the model, rather than stated as an empty array

		altLabel: altLabel ?? [],

		broader: refs(broader),
		narrower: refs(narrower),
		related: refs(related),

		embedding: decompress(embedding)

	}));


	function refs(ids: undefined | readonly Reference[]): readonly TopicReference[] {
		return (ids ?? []).map(id => ({ id, prefLabel: labels.get(id) }));
	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Taxonomy = Instance<typeof Taxonomy>;
export type Topic = Instance<typeof Topic>;


export type TopicMatch = TopicEntry & {

	readonly distance: Distance

}

export type TopicEntry = {

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

export function Taxonomy() {
	return resource(Dataset, SKOSConceptScheme, {

		space: ec2u,
		class: ec2u.Taxonomy

	}, {

		resources: multiple(reference(Topic)),

		hasConcept: multiple(reference(Topic)),
		hasTopConcept: multiple(reference(Topic))

	});
}

export function Topic() {
	return resource(Resource, SKOSConcept, {

		space: ec2u,
		class: ec2u.Topic

	}, {

		inScheme: required(reference(Taxonomy)),
		topConceptOf: optional(reference(Taxonomy)),

		dataset: required(reference(Taxonomy)),

		broader: multiple(reference(Topic)),
		broaderTransitive: multiple(reference(Topic)),
		narrower: multiple(reference(Topic)),
		related: multiple(reference(Topic)),
		exactMatch: multiple(reference(Topic)),

		digest: required(string, {

			hidden: true,

			name: "Source Digest",
			description: "A unique identification of the content the source entry carried when it was read."

		}),

		embedding: required(string, {

			hidden: true,

			name: "Semantic Embedding",
			description: `
				The position of the meaning of the topic in a semantic space, encoded in compact textual form, to be
				decoded back to a vector before it is compared to another embedding.
			`

		})

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getTopicId(taxonomy: Taxonomy, path: readonly string[]): Reference {

	return `${taxonomy.id}/${path.map(encodeURIComponent).join("/")}`;

}


export async function getTopicEmbedding(text: Text): Promise<Vector> {

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

export async function getTopicMatches(taxonomy: Taxonomy, query: Text): Promise<readonly TopicMatch[]> {

	const [vector, topics] = await Promise.all([

		getTopicEmbedding(query),
		taxonomies(taxonomy.id)

	]);

	return topics

		.map(({ embedding, ...topic }) => ({

			...topic,

			distance: cosine(vector, embedding)

		}))

		.sort(by(({ distance }) => distance));

}

export async function getTopicEntries(taxonomy: Taxonomy, topics?: readonly Reference[]): Promise<readonly TopicEntry[]> {

	return (await taxonomies(taxonomy.id))

		.filter(({ id, broader }) =>
			topics === undefined || topics.length === 0
				? broader.length === 0
				: topics.includes(id)
		)

		.sort(by(({ id }) => id))

		.map(({ embedding, ...record }) => record);

}
