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


import { Schemes } from "@ec2u/data/pages/concepts/schemes";
import { ec2u } from "@ec2u/data/views";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required, virtual } from "@metreeca/core";
import { entryCompare } from "@metreeca/core/entry";
import { id, toIdString } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { string, stringCompare } from "@metreeca/core/string";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolLabel } from "@metreeca/view/layouts/label";
import { ToolPanel } from "@metreeca/view/layouts/panel";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Concept=immutable({

	id: required("/concepts/{scheme}/*"),
	label: required(local),

	notation: multiple(string),

	prefLabel: required(local),
	// altLabel: multiple(local),
	definition: optional(local),

	inScheme: {
		id: required(id),
		label: required(local)
	},

	broaderTransitive: multiple({
		id: required(id),
		label: required(local),
		broader: optional(id)
	}),

	narrower: multiple({
		id: required(id),
		label: required(local)
	}),

	related: multiple({
		id: required(id),
		label: required(local)
	}),

	sameAs: optional(id)

});


export function DataConcept() {

	const [route]=useRouter();

	const [concept]=useResource(Concept);

	const [stats]=useResource(immutable({

		id: required("/resources/"),

		members: [{

			dataset: required({
				id: required(id),
				label: required(local)
			}),

			resources: virtual(required(integer)),
			"resources=count:": required(integer),

			"?concept": [route]

		}]

	}));


	return <DataPage name={[Schemes, concept?.inScheme, {}]}

		tray={<>

			<ToolInfo>{stats?.members?.slice()
				?.sort(({ resources: x }, { resources: y }) => x - y)
				?.map(({ dataset, resources }) => ({

					label: <ToolLink filter={["/resources/", { dataset, concept }]}>{{
						label: ec2u(dataset.label)
					}}</ToolLink>,

					value: toIntegerString(resources)

				}))

			}</ToolInfo>

		</>}
	>

		<ToolFrame placeholder={Schemes[icon]} as={({

			notation,

			prefLabel,
			definition,

			broaderTransitive,
			narrower,
			related,

			sameAs

		}) => <>

			<dfn>{toLocalString(prefLabel)}</dfn>

			{definition && <ToolMark>{toLocalString(definition)}</ToolMark>}

			<ToolPanel>

				{notation && <ToolLabel name={"Codes"}>
                    <ul>{notation.slice().sort(stringCompare).map(notation =>
						<li key={notation}>{notation}</li>
					)}</ul>
                </ToolLabel>}

				{sameAs && <ToolLabel name={"URI"}>
                    <a href={sameAs}>{toIdString(sameAs)}</a>
                </ToolLabel>}

			</ToolPanel>

			<ToolPanel stack>

				{broaderTransitive && <ToolLabel name={"Broader Concepts"}>
                    <ul style={{ listStyleType: "disclosure-open" }}>{sort(broaderTransitive).map(entry =>
						<li key={entry.id}><ToolLink>{entry}</ToolLink></li>
					)}</ul>
                </ToolLabel>}

				{narrower && <ToolLabel name={"Narrower Concepts"}>
                    <ul style={{ listStyleType: "disclosure-closed" }}>{narrower.slice().sort(entryCompare).map(entry =>
						<li key={entry.id}><ToolLink>{entry}</ToolLink></li>
					)}</ul>
                </ToolLabel>}

				{related && <ToolLabel name={"Related Concepts"}>
                    <ul>{related.slice().sort(entryCompare).map(entry =>
						<li key={entry.id}><ToolLink>{entry}</ToolLink></li>
					)}</ul>
                </ToolLabel>}

			</ToolPanel>

		</>}>{concept}</ToolFrame>

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