/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { immutable, multiple, optional, required } from "@metreeca/core";
import { entryCompare } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { numberCompare } from "@metreeca/core/number";
import { text } from "@metreeca/core/text";
import { useResource } from "@metreeca/data/models/resource";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileSpin } from "@metreeca/view/widgets/spin";
import { TileTree } from "@metreeca/view/widgets/tree";
import * as React from "react";


export const Concept=immutable({

	id: required(id),
	label: required(text),

	notation: optional({}),

	narrower: multiple({
		id: required(id)
	})

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function TileConcept({

	children: concept

}: {

	children: typeof Concept

}) {

	const [data]=useResource({
		id: concept.id,
		narrower: multiple(Concept)
	});

	return data
		? data.narrower && <TileConcepts>{data.narrower}</TileConcepts>
		: <TileSpin/>;

}

export function TileConcepts({

	children: concepts

}: {

	children: typeof Concept[]

}) {


	function conceptCompare(x: typeof Concept, y: typeof Concept): number {

		function min(strings: undefined | string[]): undefined | number {
			return strings
				?.map(parseInt)
				.reduce((min, value) => value < min ? value : min);
		}

		return numberCompare(min(x.notation) || 0, min(y.notation) || 0) || entryCompare(x, y);

	}

	return <>

		{concepts.slice().sort(conceptCompare).map(concept =>

			<TileTree key={concept.id} label={<TileLink>{concept}</TileLink>}>

				{concept.narrower && <TileConcept>{concept}</TileConcept>}

			</TileTree>
		)}

	</>;

}
