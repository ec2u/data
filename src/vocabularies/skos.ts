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

import { reference } from "@metreeca/blue/reference";
import { property, resource, type ResourceShape } from "@metreeca/blue/resource";
import { plain } from "@metreeca/blue/string";
import { multiple, optional, required } from "@metreeca/blue/value";
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

export function Concept() {
	return resource({

		class: skos.Concept,
		namespace: skos

	}, {

		notation: optional(plain), // ;( should be typed as per SKOS best practices

		prefLabel: required(plain),
		altLabel: multiple(plain),
		hiddenLabel: multiple(plain),
		definition: optional(plain),

		inScheme: required(reference(ConceptScheme)),

		topConceptOf: property({

			forward: skos,
			reverse: skos.hasTopConcept

		}, optional(reference(ConceptScheme))),

		broader: property({

			forward: skos,
			reverse: skos.narrower

		}, multiple(reference(Concept))),

		broaderTransitive: multiple(reference(Concept)),

		narrower: multiple(reference(Concept, { foreign: true })),

		related: property({

			forward: skos,
			reverse: skos

		}, multiple(reference(Concept))),

		exactMatch: property({

			forward: skos,
			reverse: skos

		}, multiple(reference(Concept)))

	});
}

export function ConceptScheme() {
	return resource({

		class: skos.ConceptScheme,
		namespace: skos

	}, {

		hasTopConcept: property({

			reverse: skos.topConceptOf

		}, multiple(reference(Concept, { foreign: true }))),

		hasConcept: property({

			hidden: true,
			reverse: skos.inScheme

		}, multiple(reference(Concept, { foreign: true })))

	});
}
