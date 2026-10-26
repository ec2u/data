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

import { Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { immutable } from "@metreeca/core/values";
import { Link } from "@metreeca/tile-cell/link";
import { useResource } from "@metreeca/tile-data/store";
import { Failure } from "../failure.js";
import { Tree } from "../tree.js";
import { getSKOSLabel, getSKOSLineage, type SKOSEntry, SKOSOrder } from "./index.core.js";


const narrower = immutable({

	id: {},

	narrower: {
		id: {},
		notation: {},
		prefLabel: {},
		narrower: {}
	}

});


/**
 * Creates a browsable concept hierarchy.
 *
 * Lists concepts in display order as tree nodes linking to their pages. A concept with narrower concepts expands to
 * list them in turn, retrieving them from the store only once the reader opens it.
 */
export function SKOSConcepts({

	concepts = []

}: {

	/**
	 * The concepts to be listed, each with the references of its narrower concepts; none if omitted.
	 */
	concepts?: readonly (SKOSEntry & { readonly narrower?: readonly string[] })[]

}) {

	return <>{[...concepts].sort(SKOSOrder).map(concept => // copy, as state is shared

		<Tree key={concept.id} label={<Link href={concept.id}>{getSKOSLabel(concept)}</Link>}>{
			concept.narrower?.length ? <SKOSNarrower id={concept.id}/> : undefined
		}</Tree>

	)}</>;

}

/**
 * Creates the lineage of a concept.
 *
 * Lists the broader concepts of a concept as tree nodes linking to their pages, root first, down to its parent.
 */
export function SKOSLineage({

	concepts = []

}: {

	/**
	 * The broader concepts, each with the references of its own direct broader concepts; none if omitted.
	 */
	concepts?: readonly (SKOSEntry & { readonly broader?: readonly string[] })[]

}) {

	return <>{getSKOSLineage(concepts).map(concept =>

		<Tree key={concept.id} label={<Link href={concept.id}>{getSKOSLabel(concept)}</Link>}/>

	)}</>;

}


function SKOSNarrower({

	id

}: {

	id: string

}) {

	const resource = useResource({
		entry: id,
		shape: Topic,
		model: narrower
	});

	return resource({

		error: ({ state }) => <Failure problem={state}/>,
		ready: ({ state }) => <SKOSConcepts concepts={state.narrower}/>

	});

}
