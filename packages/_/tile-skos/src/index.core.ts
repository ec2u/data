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

/**
 * Headless SKOS bindings.
 *
 * Binds the SKOS widgets to the concept schemes and concepts held by the shared store, leaving the widgets with
 * nothing but rendering.
 *
 * @module index.core
 */

import { Concept, Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { immutable } from "@grafctory/core/values";
import { type Collection, useCollection } from "@grafctory/tile/collection";
import { useMembers } from "@grafctory/tile/members";
import { useResource } from "@grafctory/tile/resource";
import { type Search, useSearch } from "@grafctory/tile/search";
import { SKOSConceptModel } from "./concepts.core.js";


/**
 * The concepts of a concept scheme, as shared by the widgets searching them.
 */
export type SKOSSchemeConcepts = Collection<typeof Taxonomy, "hasConcept">


const narrower = immutable({

	id: {},

	narrower: SKOSConceptModel

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Binds a component to the concepts of a concept scheme.
 *
 * @param scheme The reference of the concept scheme
 *
 * @returns The concepts of `scheme`, shared by the widgets searching and listing them
 */
export function useSKOSConcepts(scheme: string): SKOSSchemeConcepts {
	return useCollection({ entry: scheme, shape: Taxonomy, field: "hasConcept" });
}

/**
 * Binds a component to the search narrowing the concepts of a concept scheme.
 *
 * @param concepts The concepts of the scheme, as handed by {@link useSKOSConcepts}
 *
 * @returns The text narrowing `concepts` to those whose label contains it, and the transition submitting new text
 */
export function useSKOSSearch(concepts: SKOSSchemeConcepts): Search {
	return useSearch(concepts, "label");
}

/**
 * Binds a component to the concepts of a concept scheme matching the search in force.
 *
 * @param concepts The concepts of the scheme, as handed by {@link useSKOSConcepts}
 *
 * @returns The matching concepts, each with the references of its narrower concepts, as retrieved from the store
 */
export function useSKOSMatches(concepts: SKOSSchemeConcepts) {
	return useMembers(concepts, { model: SKOSConceptModel });
}

/**
 * Binds a component to the narrower concepts of a concept.
 *
 * @param concept The reference of the concept
 *
 * @returns The narrower concepts of `concept`, each with the references of its own narrower concepts, as retrieved
 *     from the store
 */
export function useSKOSNarrower(concept: string) {
	return useResource({ entry: concept, shape: Concept, model: narrower });
}
