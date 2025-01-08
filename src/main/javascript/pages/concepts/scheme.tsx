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
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
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

	extent: required(integer),

	hasConcept: virtual(multiple(Concept)),
	hasTopConcept: virtual(multiple(Concept))

});


export function DataScheme() {

	const [keywords, setKeywords]=useState("");

	const [scheme]=useResource({

		...Scheme,

		...(keywords
				? { hasConcept: multiple({ ...Concept, "~label": keywords }) }
				: { hasTopConcept: multiple(Concept) }
		)

	});


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

			hasConcept,
			hasTopConcept

		}) => <>

			<dfn>{toLocalString(title)}</dfn>

			{description && <ToolMark>{toLocalString(description)}</ToolMark>}

			<ToolInfo>{{

				"Publisher": publisher && <ToolLink>{publisher}</ToolLink>,
				"Source": source && <ToolLink>{source}</ToolLink>,

				"Rights": rights && <span>{rights}</span>,

				"License": license && <ul>{license.map(license =>
					<li key={license.id}><ToolLink>{license}</ToolLink></li>
				)}</ul>

			}}</ToolInfo>

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



