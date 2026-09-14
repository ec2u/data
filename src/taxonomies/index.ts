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
import { createStore } from "@/_/gear-store/index.js";
import { createGoogleAI, embedding } from "@/_/muse-google/index.js";
import { decompress, type Distance, type Vector } from "@/_/muse/index.js";
import { cosine } from "@/_/muse/index.js";
import { Dataset, Resource } from "@/datasets/index.js";
import { ec2u } from "@/vocabularies/ec2u.js";
import { SKOSConcept, SKOSConceptScheme } from "@/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import { by } from "@metreeca/core/order";
import type { Markdown, Text } from "@metreeca/core/strings";
import { markdown } from "@metreeca/core/strings";
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
				definition: "",
				broaderTransitive: [""],
				embedding: ""
			}]

		}

	});

	return (topics?.resources ?? []).map(({

		prefLabel,
		broaderTransitive,

		embedding,

		...topic

	}) => ({

		...topic,

		label: prefLabel,
		ancestors: broaderTransitive,

		embedding: decompress(embedding)

	}));

});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Taxonomy = Instance<typeof Taxonomy>;
export type Topic = Instance<typeof Topic>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Taxonomy() {
	return resource(Dataset, SKOSConceptScheme, {

		resources: multiple(reference(Topic)),

		hasConcept: multiple(reference(Topic)),
		hasTopConcept: multiple(reference(Topic))

	}, {

		space: ec2u,
		class: ec2u.Taxonomy

	});
}

export function Topic() {
	return resource(Resource, SKOSConcept, {

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
			description: markdown`
				Records the state of the source entry the topic was derived from, so that a taxonomy sync
				reprocesses only the entries the source document has changed.
			`

		}),

		embedding: required(string, {

			hidden: true,

			name: "Semantic Embedding",
			description: markdown`
				Positions the meaning of the topic in a semantic space, so that a resource is classified under the
				topics its text is closest to without matching its wording against labels. Encoded in compact
				textual form, to be decoded back to a vector before it is compared to another embedding.
			`

		})

	}, {

		space: ec2u,
		class: ec2u.Topic

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getTopicId(taxonomy: Taxonomy, path: readonly string[]): Reference {

	return `${taxonomy.id}/${path.map(encodeURIComponent).join("/")}`;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

export async function getTopicMatches(taxonomy: Taxonomy, query: Text): Promise<ReadonlyArray<{

	readonly id: Reference

	readonly label: Text,
	readonly definition?: Markdown
	readonly ancestors: readonly Reference[]

	readonly distance: Distance

}>> {

	const [vector, topics] = await Promise.all([

		getTopicEmbedding(query),
		taxonomies(taxonomy.id)

	]);

	return topics

		.map(({ id, label, definition, ancestors, embedding }) => ({

			id,

			label,
			definition,
			ancestors,

			distance: cosine(vector, embedding)

		}))

		.sort(by(({ distance }) => distance));

}
