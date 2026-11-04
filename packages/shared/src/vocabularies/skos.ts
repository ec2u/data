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

import { dictionary } from "@metreeca/blue/dictionary";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { string } from "@metreeca/blue/string";
import { createNamespace } from "@metreeca/core/resource";
import { markdown } from "@metreeca/core/strings";


export const skos = createNamespace("http://www.w3.org/2004/02/skos/core#", [

	"Concept",
	"ConceptScheme",

	"notation",

	"prefLabel",
	"altLabel",
	"hiddenLabel",
	"definition",

	"inScheme",
	"topConceptOf",
	"hasTopConcept",

	"broader",
	"broaderTransitive",
	"narrower",
	"related",
	"exactMatch"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function SKOSConceptScheme() {
	return resource({

		space: skos,
		class: skos.ConceptScheme,

		name: "ConceptScheme",

		description: "A set of concepts, optionally with statements of the semantic relationships between them."

	}, {

		hasTopConcept: multiple(reference(SKOSConcept), {

			foreign: true,

			reverse: skos.topConceptOf,

			description: "Topmost concepts in the concept hierarchy of the concept scheme."

		}),

		hasConcept: multiple(reference(SKOSConcept), {

			hidden: true,
			foreign: true,

			reverse: skos.inScheme

		})

	});
}

export function SKOSConcept() {
	return resource({

		space: skos,
		class: skos.Concept,

		name: "Concept",

		description: markdown`
			An idea or notion; a unit of thought.

			> [!WARNING]
			> Deviates from SKOS best practices to simplify use in frontend applications:
			>
			> - \`notation\` values are stated as plain strings rather than as the typed literals SKOS best practices
			>   recommend
		`

	}, {

		notation: optional(string, { // ;( should be typed as per SKOS best practices
			description: "Code uniquely identifying the concept within its concept scheme."
		}),

		prefLabel: required(dictionary({ uniqueLang: true }), {
			description: "Preferred lexical label of the concept."
		}),

		altLabel: optional(dictionary(), {
			description: "Alternative lexical labels of the concept."
		}),

		hiddenLabel: optional(dictionary(), {
			description: "Lexical labels of the concept excluded from visual displays."
		}),

		definition: optional(dictionary({ uniqueLang: true }), {
			description: "Formal explanation of the meaning of the concept."
		}),

		inScheme: required(reference(SKOSConceptScheme), {
			description: "Concept scheme the concept is included in."
		}),

		topConceptOf: optional(reference(SKOSConceptScheme), {

			forward: skos,
			reverse: skos.hasTopConcept,

			description: "Concept scheme the concept is a top level concept of."

		}),

		broader: multiple(reference(SKOSConcept), {

			forward: skos,
			reverse: skos.narrower,

			description: "Concepts more general in meaning than the concept."

		}),

		broaderTransitive: multiple(reference(SKOSConcept), {
			description: "Concepts more general in meaning than the concept, directly or indirectly."
		}),

		narrower: multiple(reference(SKOSConcept), {

			foreign: true,

			description: "Concepts more specific in meaning than the concept."

		}),

		related: multiple(reference(SKOSConcept), {

			forward: skos,
			reverse: skos,

			description: "Concepts associatively related to the concept."

		}),

		exactMatch: multiple(reference(SKOSConcept), {

			forward: skos,
			reverse: skos,

			description: "Concepts interchangeable in meaning with the concept."

		})

	});
}
