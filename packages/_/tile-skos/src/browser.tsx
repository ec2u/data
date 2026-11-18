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

import { Icon } from "@metreeca/clay-widgets/icon";
import { Stack } from "@metreeca/clay-widgets/stack";
import { Search } from "@metreeca/tile-widgets/search";
import { createElement } from "preact";
import type { SKOSEntry } from "./concepts.core.js";
import { SKOSConcepts } from "./concepts.js";
import { type SKOSSchemeConcepts, useSKOSConcepts, useSKOSMatches, useSKOSSearch } from "./index.core.js";


/**
 * Creates a browsable concept scheme.
 *
 * Shows the hierarchy of a concept scheme from its top concepts down, under a search box narrowing it to the
 * concepts of the scheme whose label matches a set of keywords. A flat scheme is browsed whole, without a search box.
 */
export function SKOSBrowser({

	scheme,
	concepts = []

}: {

	/**
	 * The reference of the concept scheme.
	 */
	scheme: string

	/**
	 * The top concepts of the scheme, each with the references of its narrower concepts; none if omitted.
	 */
	concepts?: readonly (SKOSEntry & { readonly narrower?: readonly string[] })[]

}) {

	const all = useSKOSConcepts(scheme);
	const search = useSKOSSearch(all);

	const searchable = search.text !== "" || concepts.some(({ narrower }) => narrower?.length);

	return <Stack space={"spacing100"}>

		{searchable && <Search name={"Concepts"} search={search}/>}

		<Stack>{search.text
			? <SKOSMatches concepts={all}/>
			: <SKOSConcepts concepts={concepts}/>
		}</Stack>

	</Stack>;

}


/**
 * Lists the concepts of a scheme matching the search in force.
 */
function SKOSMatches({

	concepts

}: {

	concepts: SKOSSchemeConcepts

}) {

	const members = useSKOSMatches(concepts);

	return members({

		error: () => createElement("tile-skos-placeholder", { role: "alert" }, <Icon.Alert/>, " Not Available"),

		ready: ({ state }) => state.length > 0
			? <SKOSConcepts concepts={state}/>
			: createElement("tile-skos-placeholder", {}, <Icon.Tags/>, " No Matches")

	});

}
