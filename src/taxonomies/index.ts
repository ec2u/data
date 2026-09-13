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

import { Dataset, Resource } from "@/datasets/index.js";
import { ec2u } from "@/vocabularies/ec2u.js";
import { SKOSConcept, SKOSConceptScheme } from "@/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import type { Instance } from "@metreeca/blue/value";
import { markdown } from "@metreeca/core/strings";
import type { Reference } from "@metreeca/qest/resource";


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

		digest: required(string, { // !!! factor?

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
				Positions the meaning of the topic in a semantic space, so that a resource is classified under
				the topics its text is closest to without matching its wording against labels.
			`

		})

	}, {

		space: ec2u,
		class: ec2u.Topic

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Names a topic of a taxonomy.
 *
 * @param taxonomy The taxonomy the topic is attributed to
 * @param taxonomy.id The identifier of the concept scheme the topic belongs to
 * @param path The labels locating the topic in the hierarchy of `taxonomy`, from the root down; each is escaped, so a
 * label is free to contain characters an IRI reserves, `/` included
 *
 * @returns The identifier of the topic `path` locates within `taxonomy`
 */
export function createTopicId(taxonomy: Instance<typeof Taxonomy>, path: readonly string[]): Reference {

	return `${taxonomy.id}/${path.map(encodeURIComponent).join("/")}`;

}
