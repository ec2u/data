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
import { Concept, TileConcepts } from "@ec2u/data/pages/concepts/skos";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required, virtual } from "@metreeca/core";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileLabel } from "@metreeca/view/layouts/label";
import { TilePanel } from "@metreeca/view/layouts/panel";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileHint } from "@metreeca/view/widgets/hint";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";
import { useState } from "react";


export const Scheme=immutable({

	id: required("/concepts/{scheme}"),
	label: required(text),

	title: required(text),
	alternative: optional(text),
	description: optional(text),

	publisher: optional({
		id: required(id),
		label: required(text)
	}),

	source: optional(id),

	rights: optional(string),
	accessRights: optional(text),

	license: multiple({
		id: required(id),
		label: required(text)
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


	return <DataPage name={[Schemes, toTextString(scheme?.alternative ?? {})]}

		tray={<>

			<TileFrame placeholder={Schemes[icon]} as={({

				publisher,
				source,
				license

			}) => <>

				<TileInfo>{{

					"Publisher": publisher && <TileLink>{publisher}</TileLink>,
					"Source": source && <TileLink>{source}</TileLink>,

					"License": license && <ul>{license.map(license =>
						<li key={license.id}><TileLink>{license}</TileLink></li>
					)}</ul>

				}}</TileInfo>

			</>}>{scheme}</TileFrame>

			<TileFrame as={({

				hasConcept

			}) => <>

				<TileInfo>{{

					"Concepts": toIntegerString(hasConcept[0].count)

				}}</TileInfo>

			</>}>{stats}</TileFrame>

		</>}

	>

		<TileFrame placeholder={Schemes[icon]} as={({

			title,
			description,

			rights,
			accessRights,

			hasConcept,
			hasTopConcept

		}) => <>

			<dfn>{toTextString(title)}</dfn>

			{description && <TileMark>{toTextString(description)}</TileMark>}

			<TilePanel stack>{Object.entries({

				"Copyright": rights,
				"Access Rights": accessRights && toTextString(accessRights)

			}).map(([

				term,
				data

			]) => data && <TileLabel key={term} name={term}>

				{data}

            </TileLabel>)

			}</TilePanel>

			{
				keywords || hasTopConcept && hasTopConcept.some(concept => concept.narrower)
					? <div style={{ marginTop: "1.5em", marginBottom: "1em" }}>
						<TileSearch placeholder={"Concepts"}>{[keywords, setKeywords]}</TileSearch>
					</div>
					: <hr/>
			}

			{hasConcept ? <TileConcepts>{hasConcept}</TileConcepts>
				: hasTopConcept ? <TileConcepts>{hasTopConcept}</TileConcepts>
					: <div><TileHint>{Schemes[icon]} No Matches</TileHint></div>
			}

		</>}>{scheme}</TileFrame>

	</DataPage>;

}



