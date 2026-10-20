/*
 * Copyright © 2013-2026 Metreeca srl
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
 * Schema.org RDF vocabulary.
 *
 * Provides the open {@link schema} namespace for referring to any schema.org term, and {@link Schema.normalize} for
 * upgrading the legacy `http://schema.org/` references still published by many sources to the canonical
 * `https://schema.org/` namespace, so that harvested data matches the terms used in shapes and queries.
 *
 * ```typescript
 * import { named, tagged, triple } from "@metreeca/trio";
 * import { Schema, schema } from "@metreeca/work/open/schema.js";
 *
 * schema.Event;                                     // "https://schema.org/Event"
 * Schema.legacy.Event;                              // "http://schema.org/Event"
 *
 * Schema.normalize(named("http://schema.org/Event"));  // { kind: "named", iri: "https://schema.org/Event" }
 *
 * Schema.normalize(triple(
 *   named("https://example.org/event"),
 *   named("http://schema.org/name"),
 *   tagged("Open Day", "en")
 * ));                                               // predicate upgraded, subject and object unchanged
 * ```
 *
 * @module
 *
 * @see {@link https://schema.org/ Schema.org}
 */

import { createNamespace } from "@metreeca/core/resource";
import { type Graph, graph, type Named, named, type Subject, type Term, type Triple, triple } from "@metreeca/trio";


const LegacyTerm = /^http:\/\/schema\.org\/([^/#]*)$/; // legacy namespace + local name, as split by RDF4J


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Schema.org vocabulary namespace.
 *
 * An open namespace resolving any term name to its IRI in the canonical `https://schema.org/` namespace.
 *
 * @see {@link https://schema.org/ Schema.org}
 */
export const schema = createNamespace("https://schema.org/");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Schema.org vocabulary helpers.
 */
export namespace Schema {

	/**
	 * Legacy schema.org vocabulary namespace.
	 *
	 * An open namespace resolving term names to IRIs in the superseded `http://schema.org/` namespace, still found in
	 * data published by many sources and upgraded to {@link schema} by {@link Schema.normalize}.
	 */
	export const legacy = createNamespace("http://schema.org/");


	/**
	 * Upgrades legacy schema.org references in an RDF graph.
	 *
	 * @param graph The RDF graph to be normalized
	 *
	 * @returns A graph holding the triples of `graph` normalized as by the {@link Triple} overload
	 */
	export function normalize(graph: Graph): Graph;

	/**
	 * Upgrades legacy schema.org references in an RDF triple.
	 *
	 * @param triple The RDF triple to be normalized
	 *
	 * @returns A triple whose subject, predicate and object are normalized as by the {@link Term} overload
	 */
	export function normalize(triple: Triple): Triple;

	/**
	 * Upgrades a legacy schema.org named resource.
	 *
	 * Legacy terms have no `/` or `#` in their local name: resources nested below the legacy namespace are preserved.
	 *
	 * @param named The named resource to be normalized
	 *
	 * @returns `named` moved to the {@link schema} namespace if it is a {@link Schema.legacy} term, `named` otherwise
	 */
	export function normalize(named: Named): Named;

	/**
	 * Upgrades a legacy schema.org subject.
	 *
	 * @param subject The triple subject to be normalized
	 *
	 * @returns `subject` normalized as by the {@link Named} overload if named, `subject` itself otherwise
	 */
	export function normalize(subject: Subject): Subject;

	/**
	 * Upgrades a legacy schema.org term.
	 *
	 * Only named resources are affected: blank nodes and literals, datatype IRIs included, are returned unchanged.
	 *
	 * @param term The RDF term to be normalized
	 *
	 * @returns `term` normalized as by the {@link Named} overload if it is a named resource, `term` itself otherwise
	 */
	export function normalize(term: Term): Term;

	export function normalize(value: Graph | Triple | Term): Graph | Triple | Term {
		return "kind" in value ? normalizeTerm(value)
			: isGraph(value) ? graph(...value.map(normalizeTriple))
				: normalizeTriple(value);
	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isGraph(value: Graph | Triple): value is Graph {
	return value.length === 0 || Array.isArray(value[0]);
}

function normalizeTriple([subject, predicate, object]: Triple): Triple {
	return triple(normalizeSubject(subject), normalizeNamed(predicate), normalizeTerm(object));
}

function normalizeSubject(subject: Subject): Subject {
	return subject.kind === "named" ? normalizeNamed(subject) : subject;
}

function normalizeTerm(term: Term): Term {
	return term.kind === "named" ? normalizeNamed(term) : term;
}

function normalizeNamed(resource: Named): Named {

	const [, name] = resource.iri.match(LegacyTerm) ?? [];

	return name === undefined ? resource : named(schema[name]);

}
