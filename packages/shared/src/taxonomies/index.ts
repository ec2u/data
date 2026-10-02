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

import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { ec2u } from "@ec2u/data-shared";
import { SKOSConcept, SKOSConceptScheme } from "@ec2u/data-shared/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import type { Markdown, Text } from "@metreeca/core/strings";
import type { Reference } from "@metreeca/qest/state";
import type { State } from "@metreeca/blue/value";


export type Taxonomy = State<typeof Taxonomy>;
export type Topic = State<typeof Topic>;


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

export function Taxonomies() {
	return resource(Dataset, {

		name: "Taxonomies",
		description: "Standardised topic taxonomies and other concept schemes for classifying resources."

	}, {

		resources: multiple(reference(Taxonomy))

	});
}

export function Taxonomy() {
	return resource(Dataset, SKOSConceptScheme, {

		space: ec2u,
		class: ec2u.Taxonomy,

		name: "Taxonomy",
		description: "A standardised topic taxonomy or other concept scheme for classifying resources."

	}, {

		resources: multiple(reference(Topic)),

		hasConcept: multiple(reference(Topic)),
		hasTopConcept: multiple(reference(Topic))

	});
}

export function Topic() {
	return resource(Resource, SKOSConcept, {

		space: ec2u,
		class: ec2u.Topic,

		name: "Topic",
		description: "A topic for classifying resources, as defined by a taxonomy."

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
