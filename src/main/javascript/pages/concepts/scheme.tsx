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
import { Concept, ToolConcepts } from "@ec2u/data/pages/concepts/skos";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required, virtual } from "@metreeca/core";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolLabel } from "@metreeca/view/layouts/label";
import { ToolPanel } from "@metreeca/view/layouts/panel";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolHint } from "@metreeca/view/widgets/hint";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import { ToolSearch } from "@metreeca/view/widgets/search";
import * as React from "react";
import { useState } from "react";


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

	hasConcept: virtual(multiple(Concept)),
	hasTopConcept: virtual(multiple(Concept))

});


export function DataScheme() {

	const [route]=useRouter();
	const [keywords, setKeywords]=useState("");

	const [scheme]=useResource({

		...Scheme,

		...(keywords
				? { hasConcept: multiple({ ...Concept, "~label": keywords }) }
				: { hasTopConcept: multiple(Concept) }
		)

	});

	const [stats]=useResource(immutable({

		id: required(route),

		hasConcept: [{

			count: virtual(required(integer)),
			"count=count:": required(integer)

		}]

	}));


	return <DataPage name={[Schemes, toLocalString(scheme?.alternative ?? {})]}

		tray={<>

			<ToolFrame placeholder={Schemes[icon]} as={({

				publisher,
				source,
				license

			}) => <>

				<ToolInfo>{{

					"Publisher": publisher && <ToolLink>{publisher}</ToolLink>,
					"Source": source && <ToolLink>{source}</ToolLink>,

					"License": license && <ul>{license.map(license =>
						<li key={license.id}><ToolLink>{license}</ToolLink></li>
					)}</ul>

				}}</ToolInfo>

			</>}>{scheme}</ToolFrame>

			<ToolFrame as={({

				hasConcept

			}) => <>

				<ToolInfo>{{

					"Concepts": toIntegerString(hasConcept[0].count)

				}}</ToolInfo>

			</>}>{stats}</ToolFrame>

		</>}

	>

		<ToolFrame placeholder={Schemes[icon]} as={({

			title,
			description,

			rights,
			accessRights,

			hasConcept,
			hasTopConcept

		}) => <>

			<dfn>{toLocalString(title)}</dfn>

			{description && <ToolMark>{toLocalString(description)}</ToolMark>}

			<ToolPanel stack>{Object.entries({

				"Copyright": rights,
				"Access Rights": accessRights && toLocalString(accessRights)

			}).map(([

				term,
				data

			]) => data && <ToolLabel key={term} name={term}>

				{data}

            </ToolLabel>)

			}</ToolPanel>

			{
				keywords || hasTopConcept && hasTopConcept.some(concept => concept.narrower)
					? <div style={{ marginTop: "1.5em", marginBottom: "1em" }}>
						<ToolSearch placeholder={"Concepts"}>{[keywords, setKeywords]}</ToolSearch>
					</div>
					: <hr/>
			}

			{hasConcept ? <ToolConcepts>{hasConcept}</ToolConcepts>
				: hasTopConcept ? <ToolConcepts>{hasTopConcept}</ToolConcepts>
					: <div><ToolHint>{Schemes[icon]} No Matches</ToolHint></div>
			}

		</>}>{scheme}</ToolFrame>

	</DataPage>;

}



