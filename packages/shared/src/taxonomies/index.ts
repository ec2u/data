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

import { base, Dataset, EC2U, ec2u, licenses } from "@ec2u/data-shared";
import { Resource } from "@ec2u/data-shared/resources/index.js";
import { SKOSConcept, SKOSConceptScheme } from "@ec2u/data-shared/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";


// never read from taxonomy modules at load time: they are imported cyclically by the shapes below

export const taxonomies = immutable({

	id: resolve(base, "/taxonomies/"),

	dataset: base,

	label: "EC2U Taxonomies",

	title: { en: "EC2U Classification Taxonomies" },
	alternative: { en: "EC2U Taxonomies" },
	description: { en: "Standardised topic taxonomies and other concept schemes for classifying resources." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2021-09-06",
	issued: "2021-09-06"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Taxonomy = State<typeof Taxonomy>;
export type Topic = State<typeof Topic>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Taxonomies() {
	return resource(Dataset, {

		pattern: taxonomies.id,

		name: taxonomies.alternative,
		description: taxonomies.description

	}, {

		resources: multiple(reference(Taxonomy))

	});
}

export function Taxonomy() {
	return resource(Dataset, SKOSConceptScheme, {

		space: ec2u,
		class: ec2u.Taxonomy,
		pattern: `${taxonomies.id}{taxonomy}`,

		name: "EC2U Taxonomy",
		description: "A standardised topic taxonomy or other concept scheme for classifying resources."

	}, {

		version: optional(string, {

			name: "Version",
			description: "Release of the taxonomy, as identified by its publisher."

		}),

		resources: multiple(reference(Topic)),

		hasConcept: multiple(reference(Topic)),
		hasTopConcept: multiple(reference(Topic))

	});
}

export function Topic() {
	return resource(Resource, SKOSConcept, {

		space: ec2u,
		class: ec2u.Topic,
		pattern: `${taxonomies.id}*`,

		name: "EC2U Topic",
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

export function getTopicId(taxonomy: Taxonomy, path: string): Reference {

	return `${(taxonomy.id)}/${path.split("/").map(encodeURIComponent).join("/")}`;

}
