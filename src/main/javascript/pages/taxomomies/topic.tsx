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


import { SKOSConcept, TileSKOSConcepts } from "@ec2u/data/pages/taxomomies/skos";
import { Taxonomies } from "@ec2u/data/pages/taxomomies/taxonomies";
import { DataAI } from "@ec2u/data/views/ai";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { entryCompare } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileLabel } from "@metreeca/view/layouts/label";
import { TilePanel } from "@metreeca/view/layouts/panel";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import { TileTree } from "@metreeca/view/widgets/tree";
import React from "react";

export const Topic=immutable({

	id: required("/taxonomies/{taxonomy}/*"),
	label: required(text),


	generated: optional(boolean),
	isDefinedBy: optional(id),

	notation: optional(string),

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

	narrower: multiple(SKOSConcept),

	related: multiple({
		id: required(id),
		label: required(text)
	}),

	exactMatch: multiple({
		id: required(id),
		label: required(text)
	})

});


export function DataTopic() {

	const [topic]=useResource(Topic);


	return <DataPage name={[Taxonomies, topic?.inScheme, {}]}

		tray={<>

			<TileFrame as={({

				notation

			}) => <>

				<TileInfo>{{

					"Code": notation

				}}</TileInfo>

			</>}>{topic}</TileFrame>

		</>}

		info={<DataAI>{topic?.generated}</DataAI>}

	>

		<TileFrame placeholder={Taxonomies[icon]} as={({

			isDefinedBy,

			prefLabel,
			definition,

			broaderTransitive,
			narrower,
			related,

			exactMatch

		}) => <>

			<dfn>{toTextString(prefLabel)}</dfn>

			{definition && <TileMark>{toTextString(definition)}</TileMark>}

			<TilePanel stack>

				{isDefinedBy &&
                    <TileLabel name={"Source"}><TileLink>{isDefinedBy}</TileLink></TileLabel>
				}

				{broaderTransitive?.length &&
                    <TileLabel name={"Broader Concepts"}>{sort(broaderTransitive).map(entry =>
						<TileTree key={entry.id} expanded={"force"} label={<TileLink>{entry}</TileLink>}/>
					)}</TileLabel>}

				{narrower?.length && <TileLabel name={"Narrower Concepts"}>
                    <TileSKOSConcepts>{narrower}</TileSKOSConcepts>
                </TileLabel>}

				{related?.length && <TileLabel name={"Related Concepts"}>
                    <ul>{related.slice().sort(entryCompare).map(entry =>
						<li key={entry.id}><TileLink>{entry}</TileLink></li>
					)}</ul>
                </TileLabel>}

				{exactMatch?.length && <TileLabel name={"Exact Matches"}>
                    <ul>{exactMatch.slice().sort(entryCompare).map(entry =>
						<li key={entry.id}><TileLink>{entry}</TileLink></li>
					)}</ul>
                </TileLabel>}

			</TilePanel>

		</>}>{topic}</TileFrame>

	</DataPage>;

}


function sort(concepts: NonNullable<typeof Topic.broaderTransitive>) {

	const links: { [id: string]: undefined | string }=concepts.reduce((index, concept) => ({

		[concept.id]: concept.broader, ...index

	}), {});


	return concepts?.slice().sort((x, y) => depth(x.id) - depth(y.id));


	function depth(concept: undefined | string): number {
		return concept === undefined ? 0 : depth(links[concept]) + 1;
	}

}