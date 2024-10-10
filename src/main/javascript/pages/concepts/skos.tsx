/*
 * Copyright © 2020-2024 EC2U Alliance
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

import { immutable, multiple, required } from "@metreeca/core";
import { entryCompare } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { useResource } from "@metreeca/data/models/resource";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolSpin } from "@metreeca/view/widgets/spin";
import { ToolTree } from "@metreeca/view/widgets/tree";
import * as React from "react";


export const Concept=immutable({

	id: required(id),
	label: required(id),

	narrower: multiple({
		id: required(id)
	})

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ToolConcept({

	children: concept

}: {

	children: typeof Concept

}) {

	const [data]=useResource({
		id: concept.id,
		narrower: multiple(Concept)
	});

	return data
		? data.narrower && <ToolConcepts>{data.narrower}</ToolConcepts>
		: <ToolSpin/>;

}

export function ToolConcepts({

	children: concepts

}: {

	children: typeof Concept[]

}) {

	return <>

		{concepts.slice().sort(entryCompare).map(concept =>

			<ToolTree key={concept.id} label={<ToolLink>{concept}</ToolLink>}>

				{concept.narrower && <ToolConcept>{concept}</ToolConcept>}

			</ToolTree>
		)}

	</>;

}
