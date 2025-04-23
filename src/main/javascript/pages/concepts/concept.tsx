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


import { Schemes } from "@ec2u/data/pages/concepts/schemes";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entryCompare } from "@metreeca/core/entry";
import { id, toIdString } from "@metreeca/core/id";
import { text, toTextString } from "@metreeca/core/text";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileLabel } from "@metreeca/view/layouts/label";
import { TilePanel } from "@metreeca/view/layouts/panel";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Concept=immutable({

	id: required("/concepts/{scheme}/*"),
	label: required(text),

	// !!! generated: optional(boolean),

	notation: optional({}),

	prefLabel: required(text),
	definition: optional(text),

	inScheme: {
		id: required(id),
		label: required(text)
	},

	broaderTransitive: multiple({
		id: required(id),
		label: required(text),
		broader: optional(id)
	}),

	narrower: multiple({
		id: required(id),
		label: required(text)
	}),

	related: multiple({
		id: required(id),
		label: required(text)
	}),

	sameAs: optional(id)

});


export function DataConcept() {

	const [route]=useRouter();

	const [concept]=useResource(Concept);


	return <DataPage name={[Schemes, concept?.inScheme, {}]} /* info={<DataAI>{concept?.generated}</DataAI>} */>

		<TileFrame placeholder={Schemes[icon]} as={({

			notation,

			prefLabel,
			definition,

			broaderTransitive,
			narrower,
			related,

			sameAs

		}) => <>

			<dfn>{toTextString(prefLabel)}</dfn>

			{definition && <TileMark>{toTextString(definition)}</TileMark>}

			<TilePanel>

				{/* {notation && <TileLabel name={"Codes"}>
                    <ul>{notation.slice().sort(stringCompare).map(notation =>
						<li key={notation}>{notation}</li>
					)}</ul>
				 </TileLabel>} */}

				{sameAs && <TileLabel name={"URI"}>
                    <a href={sameAs}>{toIdString(sameAs)}</a>
                </TileLabel>}

			</TilePanel>

			<TilePanel stack>

				{broaderTransitive && <TileLabel name={"Broader Concepts"}>
                    <ul style={{ listStyleType: "disclosure-open" }}>{sort(broaderTransitive).map(entry =>
						<li key={entry.id}><TileLink>{entry}</TileLink></li>
					)}</ul>
                </TileLabel>}

				{narrower && <TileLabel name={"Narrower Concepts"}>
                    <ul style={{ listStyleType: "disclosure-closed" }}>{narrower.slice().sort(entryCompare).map(entry =>
						<li key={entry.id}><TileLink>{entry}</TileLink></li>
					)}</ul>
                </TileLabel>}

				{related && <TileLabel name={"Related Concepts"}>
                    <ul>{related.slice().sort(entryCompare).map(entry =>
						<li key={entry.id}><TileLink>{entry}</TileLink></li>
					)}</ul>
                </TileLabel>}

			</TilePanel>

		</>}>{concept}</TileFrame>

	</DataPage>;

}


function sort(concepts: NonNullable<typeof Concept.broaderTransitive>) {

	const links: { [id: string]: undefined | string }=concepts.reduce((index, concept) => ({

		[concept.id]: concept.broader, ...index

	}), {});


	return concepts?.slice().sort((x, y) => depth(x.id) - depth(y.id));


	function depth(concept: undefined | string): number {
		return concept === undefined ? 0 : depth(links[concept]) + 1;
	}

}