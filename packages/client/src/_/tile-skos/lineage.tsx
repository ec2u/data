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

import { Link } from "@metreeca/clay-widgets/link";
import { Tree } from "../clay-widgets/tree.js";
import { getSKOSLabel, getSKOSLineage, type SKOSEntry } from "./concepts.core.js";


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
