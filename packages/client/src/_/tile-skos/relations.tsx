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

import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Link } from "@metreeca/clay-widgets/link";
import { Strip } from "@metreeca/clay-widgets/strip";
import { by, locale } from "@metreeca/core/order";
import type { SKOSEntry } from "./concepts.core.js";
import { SKOSConcepts } from "./concepts.js";
import { SKOSLineage } from "./lineage.js";


/**
 * A concept linked by label alone, outside the hierarchy of the concept on show.
 */
export type SKOSLink = {

	readonly id: string
	readonly label: string

}


/**
 * Creates the relations of a concept.
 *
 * Shows the hierarchy of a concept (its lineage and its narrower concepts) beside the concepts it is associated with
 * or matched to elsewhere, the latter moving below the hierarchy where the two do not fit side by side. A relation
 * with no concept is left out, and so is a column with no relation left.
 */
export function SKOSRelations({

	broader = [],
	narrower = [],
	related = [],
	matches = []

}: {

	/**
	 * The broader concepts, each with the references of its own direct broader concepts; none if omitted.
	 */
	broader?: readonly (SKOSEntry & { readonly broader?: readonly string[] })[]

	/**
	 * The narrower concepts, each with the references of its own narrower concepts; none if omitted.
	 */
	narrower?: readonly (SKOSEntry & { readonly narrower?: readonly string[] })[]

	/**
	 * The concepts associated with the concept on show; none if omitted.
	 */
	related?: readonly SKOSLink[]

	/**
	 * The concepts in other schemes matching the concept on show exactly; none if omitted.
	 */
	matches?: readonly SKOSLink[]

}) {

	const hierarchy = broader.length > 0 || narrower.length > 0;
	const associations = related.length > 0 || matches.length > 0;

	return <Strip wrap align={"start"} space={"spacing200"}>

		{hierarchy && <Infobox wrap>{{

			"Broader": broader.length > 0 ? <SKOSLineage concepts={broader}/> : undefined,
			"Narrower": narrower.length > 0 ? <SKOSConcepts concepts={narrower}/> : undefined

		}}</Infobox>}

		{associations && <Infobox wrap>{{

			"Related": links(related),
			"Matches": links(matches)

		}}</Infobox>}

	</Strip>;

}


/**
 * Lists linked concepts in alphabetical order.
 *
 * @returns The list, or `undefined` if no concept is linked, so the infobox leaves the entry out
 */
function links(concepts: readonly SKOSLink[]) {

	return concepts.length > 0 ? <ul>{[...concepts] // copy, as state is shared

		.sort(by(({ label }) => label, locale()))

		.map(({ id, label }) => <li key={id}><Link href={id}>{label}</Link></li>)

	}</ul> : undefined;

}
