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
 * Wikidata RDF vocabulary.
 *
 * Provides the open namespaces for referring to Wikibase ontology terms, Wikidata entities and properties, and the
 * {@link Wikidata} constants naming the query service endpoint and the terms most queries rely on.
 *
 * ```typescript
 * import { wd, wdt, Wikidata } from "@metreeca/work/open/wikidata.js";
 *
 * wd.Q42;                  // "http://www.wikidata.org/entity/Q42"
 * wdt.P31;                 // "http://www.wikidata.org/prop/direct/P31"
 *
 * Wikidata.Endpoint;       // "https://query.wikidata.org/sparql"
 * Wikidata.P625;           // coordinate location, read with WGSPoint.from()
 * ```
 *
 * @module
 *
 * @see {@link https://www.wikidata.org/ Wikidata}
 * @see {@link https://www.mediawiki.org/wiki/Wikibase/Indexing/RDF_Dump_Format Wikibase RDF Dump Format}
 */

import { createNamespace, type IRI } from "@metreeca/core/resource";
import { rdfs } from "@metreeca/trio";
import { skos } from "./skos.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wikibase ontology namespace.
 *
 * An open namespace resolving term names to IRIs in the `http://wikiba.se/ontology#` namespace.
 */
export const wb = createNamespace("http://wikiba.se/ontology#");

/**
 * Wikidata entity namespace.
 *
 * An open namespace resolving item and property identifiers to entity IRIs, as in `wd.Q42`.
 */
export const wd = createNamespace("http://www.wikidata.org/entity/");

/**
 * Wikidata property namespace.
 *
 * An open namespace resolving property identifiers to the IRIs linking items to their full statement nodes.
 */
export const wdp = createNamespace("http://www.wikidata.org/prop/");

/**
 * Wikidata direct property namespace.
 *
 * An open namespace resolving property identifiers to the IRIs linking items directly to their best-ranked values.
 */
export const wdt = createNamespace("http://www.wikidata.org/prop/direct/");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wikidata constants.
 */
export namespace Wikidata {

	/**
	 * Wikidata Query Service SPARQL endpoint.
	 */
	export const Endpoint = "https://query.wikidata.org/sparql";


	/**
	 * Wikibase item class.
	 */
	export const Item = wb.Item;

	/**
	 * Wikibase property class.
	 */
	export const Property = wb.Property;

	/**
	 * Wikibase sitelink count property.
	 */
	export const Sitelinks = wb.sitelinks;


	/**
	 * Instance of.
	 */
	export const P31 = wdt.P31;

	/**
	 * Subclass of.
	 */
	export const P279 = wdt.P279;

	/**
	 * Subproperty of.
	 */
	export const P1647 = wdt.P1647;

	/**
	 * Coordinate location, as a Well-Known Text literal.
	 */
	export const P625 = wdt.P625;

	/**
	 * Demonym.
	 */
	export const P1549 = wdt.P1549;


	/**
	 * Wikimedia disambiguation page.
	 */
	export const Q4167410 = wd.Q4167410;


	/**
	 * Properties holding entity names: the preferred label and the alternative labels.
	 */
	export const Names: readonly IRI[] = [rdfs.label, skos.altLabel];

}
