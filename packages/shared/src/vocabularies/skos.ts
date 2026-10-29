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
		class: skos.ConceptScheme

	}, {

		hasTopConcept: multiple(reference(SKOSConcept), {

			foreign: true,

			reverse: skos.topConceptOf

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
		class: skos.Concept

	}, {

		notation: optional(string), // ;( should be typed as per SKOS best practices

		prefLabel: required(dictionary({ uniqueLang: true })),
		altLabel: optional(dictionary()),
		hiddenLabel: optional(dictionary()),
		definition: optional(dictionary({ uniqueLang: true })),

		inScheme: required(reference(SKOSConceptScheme)),

		topConceptOf: optional(reference(SKOSConceptScheme), {

			forward: skos,
			reverse: skos.hasTopConcept

		}),

		broader: multiple(reference(SKOSConcept), {

			forward: skos,
			reverse: skos.narrower

		}),

		broaderTransitive: multiple(reference(SKOSConcept)),

		narrower: multiple(reference(SKOSConcept), {

			foreign: true

		}),

		related: multiple(reference(SKOSConcept), {

			forward: skos,
			reverse: skos

		}),

		exactMatch: multiple(reference(SKOSConcept), {

			forward: skos,
			reverse: skos

		})

	});
}
