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
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { entryCompare } from "@metreeca/core/entry";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolLabel } from "@metreeca/view/layouts/label";
import { ToolPanel } from "@metreeca/view/layouts/panel";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import * as React from "react";


export const Scheme=immutable({

	id: required("/concepts/{scheme}"),
	label: required(local),

	title: required(local),
	alternative: optional(local),
	description: optional(local),

	publisher: optional({
		id: required(id),
		label: required(local)
	}),

	source: optional(id),

	rights: optional(string),
	accessRights: optional(local),

	license: multiple({
		id: required(id),
		label: required(local)
	}),

	extent: required(integer),

	hasTopConcept: multiple({

		id: required(id),
		label: required(id),

		prefLabel: required(local),
		definition: optional(local)

	})

});

export function DataScheme() {

	const [scheme]=useResource(Scheme);


	return <DataPage name={[Schemes, toLocalString(scheme?.alternative ?? {})]}

		tray={<ToolFrame as={({

			extent

		}) => <>

			<ToolInfo>{{

				"Concepts": toIntegerString(extent)

			}}</ToolInfo>

		</>}>{scheme}</ToolFrame>}

	>

		<ToolFrame placeholder={Schemes[icon]} as={({

			title,
			description,

			publisher,
			source,

			rights,
			license,

			hasTopConcept

		}) => <>

			<dfn>{toLocalString(title)}</dfn>

			{description && <ToolMark>{toLocalString(description)}</ToolMark>}

			<ToolInfo>{{

				"Publisher": publisher && <ToolLink>{publisher}</ToolLink>,
				"Source": source && <ToolLink>{source}</ToolLink>,

				"Rights": rights && <span>{rights}</span>,

				"License": license?.length && <ul>{license.map(license =>
					<li key={license.id}><ToolLink>{license}</ToolLink></li>
				)}</ul>

			}}</ToolInfo>

			<ToolPanel>

				{hasTopConcept && <ToolLabel name={"Top Concepts"}>
                    <ul>{hasTopConcept.slice().sort(entryCompare).map(entry =>
						<li key={entry.id}><ToolLink>{entry}</ToolLink></li>
					)}</ul>
                </ToolLabel>}

			</ToolPanel>

		</>}>{scheme}</ToolFrame>

	</DataPage>;

}


function ToolConcepts() {


}
