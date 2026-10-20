/*
 * Copyright © 2026 Metreeca srl
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

import { createNamespace } from "@metreeca/core/resource";


/**
 * SKOS vocabulary namespace.
 *
 * Closed and complete over the SKOS Core vocabulary.
 *
 * @see {@link https://www.w3.org/TR/skos-reference/ SKOS Simple Knowledge Organization System Reference}
 */
export const skos = createNamespace("http://www.w3.org/2004/02/skos/core#", [

	"Concept",
	"ConceptScheme",
	"Collection",
	"OrderedCollection",

	"inScheme",
	"hasTopConcept",
	"topConceptOf",

	"prefLabel",
	"altLabel",
	"hiddenLabel",

	"notation",

	"note",
	"changeNote",
	"definition",
	"editorialNote",
	"example",
	"historyNote",
	"scopeNote",

	"semanticRelation",
	"broader",
	"narrower",
	"related",
	"broaderTransitive",
	"narrowerTransitive",

	"member",
	"memberList",

	"mappingRelation",
	"broadMatch",
	"narrowMatch",
	"relatedMatch",
	"exactMatch",
	"closeMatch"

]);
