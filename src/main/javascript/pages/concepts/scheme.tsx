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
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import * as React from "react";
import { sortEntries } from "../../../../../../../../Products/Tool/code/core/entry";
import { ToolLink } from "../../../../../../../../Products/Tool/code/view/widgets/link";


export const Scheme=immutable({

	id: required("/concepts/{scheme}"),

	label: required(local),
	comment: optional(local),

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


	return <DataPage name={[Schemes, scheme]}

		tray={<ToolFrame as={({

			extent

		}) => <>

			<ToolInfo>{{

				"Concepts": toIntegerString(extent)

			}}</ToolInfo>

		</>}>{scheme}</ToolFrame>}

	>

		<ToolFrame placeholder={Schemes[icon]} as={({

			comment,

			hasTopConcept

		}) => <>

			{comment && <p>{toLocalString(comment)}</p>}

			{hasTopConcept?.length && <>

                <hr/>

                <dl>

                    <dt>Top Concepts</dt>
                    <dd>
                        <ul>{sortEntries(hasTopConcept).map(entry =>
							<li key={entry.id}><ToolLink>{entry}</ToolLink></li>
						)}</ul>
                    </dd>

                </dl>

            </>}

		</>}>{scheme}</ToolFrame>

	</DataPage>;

}
