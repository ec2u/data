/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { opt, type URLLike } from "@metreeca/core";
import { multiple, optional } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { string, type Target, xml as parse, xpath } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import type { Document } from "domhandler";
import type { Draft } from "../sinks/sync.js";


const SKOS = "http://www.w3.org/2004/02/skos/core#";
const SKOSXL = "http://www.w3.org/2008/05/skos-xl#";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates an RDF/XML taxonomy loader.
 *
 * Retrieves each document and reads it as a SKOS concept scheme serialised as flat RDF/XML, one `rdf:Description` per
 * resource, as published by the EU Vocabularies service, one topic draft per `skos:Concept`. Drafts carry English
 * labels stated either as plain SKOS literals or as SKOS-XL label resources, the notation, the definition, and the
 * chain of broader concepts each concept descends from, following the first parent where a concept states several.
 *
 * Topics are named by the IRI of their concept relative to `namespace`, so a topic keeps the local name the publisher
 * gave its concept however the scheme is reorganised, and a renamed concept reads as a new topic.
 *
 * @param namespace The IRI prefix shared by the concepts of the scheme
 *
 * @returns A task converting a feed of RDF/XML document URLs into a feed of topic drafts
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if a concept lies outside `namespace` or if it
 * states no English preferred label, either as a plain literal or as a label resource
 */
export function xml(namespace: string): Task<URLLike, Draft> {

	return urls => pipe(
		(items(urls))
		(fetch())
		(parse())
		(flat(map<Document, readonly Draft[]>(read)))
	);


	function read(document: Document): readonly Draft[] {

		const select = xpath(document);

		const labels = new Map(select(`/rdf:RDF/rdf:Description[rdf:type/@rdf:resource='${SKOSXL}Label']`)
			.map((label): readonly [string, readonly string[]] => [
				about(label),
				xpath(label)("literalForm[@xml:lang='en']").map(string)
			])
		);

		const concepts = select(`/rdf:RDF/rdf:Description[rdf:type/@rdf:resource='${SKOS}Concept']`).map(concept => {

			const at = xpath(concept);

			return {

				name: local(about(concept)),

				notation: at(`notation[@xmlns='${SKOS}']`).map(string).at(0),

				prefLabel: english(at, "prefLabel"),
				altLabel: english(at, "altLabel"),
				hiddenLabel: english(at, "hiddenLabel"),

				definition: at(`definition[@xmlns='${SKOS}'][@xml:lang='en']`).map(string).at(0),

				parent: opt(at(`broader[@xmlns='${SKOS}']/@rdf:resource`).map(string).at(0), local)

			};

		});

		const parents = new Map(concepts.map(({ name, parent }) => [name, parent]));

		return concepts.map(({ name, notation, prefLabel, altLabel, hiddenLabel, definition, parent }) => {

			const broader = lineage(parent, [name]);

			return immutable({

				id: name,

				notation: optional(notation),

				prefLabel: { en: prefLabel.at(0) ?? fail(`concept <${name}> states no English preferred label`) },
				altLabel: altLabel.length === 0 ? undefined : { en: altLabel },
				hiddenLabel: hiddenLabel.length === 0 ? undefined : { en: hiddenLabel },
				definition: opt(definition, definition => ({ en: definition })),

				broader: multiple(broader.slice(-1)),
				broaderTransitive: multiple(broader)

			});

		});


		/**
		 * Collects the English forms of a label property, stated as plain literals or as SKOS-XL label resources.
		 */
		function english(at: (path: string) => readonly Target[], property: string): readonly string[] {
			return [...new Set([

				...at(`${property}[@xmlns='${SKOS}'][@xml:lang='en']`).map(string),
				...at(`${property}[@xmlns='${SKOSXL}']/@rdf:resource`).map(string).flatMap(label => labels.get(label) ?? [])

			])].filter(label => label !== "");
		}

		/**
		 * Lists the ancestors of a concept from the root of the scheme down to its parent, ignoring links closing a
		 * cycle.
		 */
		function lineage(parent: undefined | string, trail: readonly string[]): readonly string[] {
			return parent === undefined || trail.includes(parent) ? []
				: [...lineage(parents.get(parent), [...trail, parent]), parent];
		}

		function about(node: Target): string {
			return string(xpath(node)("@rdf:about")[0] ?? "");
		}

		function local(iri: string): string {
			return iri.startsWith(namespace) ? iri.slice(namespace.length)
				: fail(`concept <${iri}> lies outside namespace <${namespace}>`);
		}

		function fail(message: string): never {
			throw new RangeError(message);
		}

	}

}
