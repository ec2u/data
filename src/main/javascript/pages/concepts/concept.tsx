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


import { DataConceptList } from "@ec2u/data/pages/concepts/scheme";
import { Schemes } from "@ec2u/data/pages/concepts/schemes";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { id } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import React from "react";

export const Concept=immutable({

	id: required("/concepts/{scheme}/*"),
	label: required(local),

	prefLabel: required(local),
	// altLabel: multiple(local),
	definition: optional(local),

	inScheme: {
		id: required(id),
		label: required(local)
	},

	// broaderTransitive: multiple({
	//     id: required(id),
	//     label: required(local)
	// }),

	broader: multiple({
		id: required(id),
		label: required(local)
	}),

	narrower: multiple({
		id: required(id),
		label: required(local)
	}),

	related: multiple({
		id: required(id),
		label: required(local)
	})

});


export function DataConcept() {

	const [concept]=useResource(Concept);


	return <DataPage name={[Schemes, concept?.inScheme, concept]}>

		<ToolFrame placeholder={Schemes[icon]} as={({

			definition,

			broader,
			narrower,
			related

		}) => <>

			{definition && <p>{toLocalString(definition)}</p>}

			{(broader?.length || narrower?.length || related?.length) && <>

                <hr/>

                <dl>

					{broader?.length && <>

                        <dt>Broader Concepts</dt>
                        <dd>{DataConceptList(broader)}</dd>

                    </>}

					{narrower?.length && <>

                        <dt>Narrower Concepts</dt>
                        <dd>{DataConceptList(narrower)}</dd>

                    </>}

					{related?.length && <>

                        <dt>Narrower Concepts</dt>
                        <dd>{DataConceptList(related)}</dd>

                    </>}

                </dl>

            </>}


			{/*     {broader?.length && <NodeLabel name={"Broader"}>{[...broader]

			 .sort((x, y) => string(x).localeCompare(string(y)))
			 .map(concept => <NodeLink key={concept.id}>{concept}</NodeLink>)

			 }</NodeLabel>}

			 {narrower?.length && <NodeLabel name={"Narrower"}>{[...narrower]

			 .sort((x, y) => string(x).localeCompare(string(y)))
			 .map(concept => <NodeLink key={concept.id}>{concept}</NodeLink>)

			 }</NodeLabel>} */}

		</>}>{concept}</ToolFrame>

	</DataPage>;

}