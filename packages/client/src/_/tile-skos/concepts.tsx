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
import { Link } from "@metreeca/clay-widgets/link";
import { immutable } from "@metreeca/core/values";
import { useResource } from "@metreeca/tile/resource";
import { Failure } from "../../widgets/failure.js";
import { Tree } from "../clay-widgets/tree.js";
import { getSKOSLabel, SKOSConceptModel, type SKOSEntry, SKOSOrder } from "./concepts.core.js";


const narrower = immutable({

	id: {},

	narrower: SKOSConceptModel

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
