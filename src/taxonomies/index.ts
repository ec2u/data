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

import { CCBYNCND40, Copyright, datasets } from "@/datasets/index.core.js";
import { Dataset, Resource } from "@/datasets/index.js";
import { base, EC2U, ec2u } from "@/vocabularies/ec2u.js";
import { Concept, ConceptScheme } from "@/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, required, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";


export const taxonomies = immutable({

	id: `${base}/taxonomies`,

	isDefinedBy: `${base}/datasets/taxonomies`,
	dataset: datasets.id,

	label: "EC2U Taxonomies",

	title: "EC2U Classification Taxonomies",
	alternative: "EC2U Taxonomies",
	description: "Standardised topic taxonomies and other concept schemes for classifying resources.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Taxonomy() {
	return resource(Dataset, ConceptScheme, {

		// ;( the `Taxonomy`/`Topic` pair admits one refined direction only: refining `Topic.dataset`, `inScheme` and
		// ;( `topConceptOf` back to `Taxonomy` would close a circular definition

		resources: multiple(reference(Topic)),

		hasConcept: multiple(reference(Topic)),
		hasTopConcept: multiple(reference(Topic))

	}, {

		space: ec2u,
		class: ec2u.Taxonomy

	});
}

export function Topic() {
	return resource(Resource, Concept, {

		// ;( `broader`, `broaderTransitive`, `narrower`, `related` and `exactMatch` not narrowed to `Topic`: an
		// ;( override targeting the very shape that declares it closes a circular definition

		// ;( `inScheme`, `topConceptOf` and `dataset` not narrowed to `Taxonomy`: `Taxonomy` already narrows the
		// ;( opposite direction, and refining both ends closes a circular definition

		digest: required(string, {

			hidden: true,

			name: "Source Digest",
			description: markdown`
				Records the state of the source entry the topic was derived from, so that a taxonomy sync
				reprocesses only the entries the source document has changed.
			`

		})

	}, {

		space: ec2u,
		class: ec2u.Topic

	});
}
export { EventTopic } from "@/taxonomies/pipes/events.js";
