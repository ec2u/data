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

import { Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Stack } from "@metreeca/clay-widgets/stack";
import { Search } from "@metreeca/tile-widgets/search";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useEffect, useState } from "preact/hooks";
import { Failure } from "../../widgets/failure.js";
import { TreePlaceholder } from "../clay-widgets/tree.js";
import { SKOSConceptModel, type SKOSEntry } from "./concepts.core.js";
import { SKOSConcepts } from "./concepts.js";


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

	const [keywords, setKeywords] = useState("");

	const searchable = keywords !== "" || concepts.some(({ narrower }) => narrower?.length);

	return <Stack space={"spacing100"}>

		{searchable && <Search name={"Concepts"} search={{ text: keywords, submit: setKeywords }}/>}

		<Stack>{keywords
			? <SKOSMatches scheme={scheme} keywords={keywords}/>
			: <SKOSConcepts concepts={concepts}/>
		}</Stack>

	</Stack>;

}


/**
 * Lists the concepts of a scheme whose label matches a set of keywords.
 */
function SKOSMatches({

	scheme,
	keywords

}: {

	scheme: string
	keywords: string

}) {

	const collection = useCollection({

		entry: scheme,
		shape: Taxonomy,
		field: "hasConcept",

		query: { "~label": keywords }

	});


	useEffect(() => { collection.filter({ "~label": keywords }); }, [collection, keywords]);

	const members = useMembers(collection, { model: SKOSConceptModel });

	return members({

		error: ({ state }) => <Failure problem={state}><Empty><Icon.Tags/></Empty></Failure>,

		ready: ({ state }) => state.length > 0
			? <SKOSConcepts concepts={state}/>
			: <TreePlaceholder><Icon.Tags/> No Matches</TreePlaceholder>

	});

}
