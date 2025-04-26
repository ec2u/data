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
import { immutable, multiple, optional, required, virtual } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { date, toDateString } from "@metreeca/core/date";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileHint } from "@metreeca/view/widgets/hint";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import { TileSearch } from "@metreeca/view/widgets/search";
import * as React from "react";
import { useState } from "react";


export const Taxonomy=immutable({

	generated: optional(boolean),

	id: required("/taxonomies/{taxonomy}"),

	title: required(text),
	alternative: optional(text),
	description: optional(text),

	version: optional(string),
	created: optional(date),
	issued: optional(date),
	modified: optional(date),

	publisher: optional({
		id: required(id),
		label: required(text)
	}),

	source: optional({
		id: required(id)
	}),

	rights: optional(string),
	accessRights: optional(text),

	license: multiple({
		id: required(id),
		label: required(text)
	}),

	hasConcept: virtual(multiple(SKOSConcept)),
	hasTopConcept: virtual(multiple(SKOSConcept))

});


export function DataTaxonomy() {

	const [route]=useRouter();
	const [keywords, setKeywords]=useState("");

	const [taxonomy]=useResource({

		...Taxonomy,

		...(keywords
				? { hasConcept: multiple({ ...SKOSConcept, "~label": keywords }) }
				: { hasTopConcept: multiple(SKOSConcept) }
		)

	});

	const [stats]=useResource(immutable({

		id: required(route),

		hasConcept: [{

			count: virtual(required(integer)),
			"count=count:": required(integer)

		}]

	}));


	return <DataPage name={[Taxonomies, toTextString(taxonomy?.alternative ?? taxonomy?.title ?? {})]}

		tray={<>

			<TileFrame as={({

				hasConcept

			}) => <>

				<TileInfo>{{

					"Concepts": toIntegerString(hasConcept[0].count)

				}}</TileInfo>

			</>}>{stats}</TileFrame>

			<TileFrame placeholder={Taxonomies[icon]} as={({

				version,
				created,
				issued,
				modified


			}) => <>

				<TileInfo>{{

					"Version": version,
					"Created": created && toDateString(created),
					"Published": issued && toDateString(issued),
					"Modified": modified && toDateString(modified)

				}}</TileInfo>

			</>}>{taxonomy}</TileFrame>


		</>}

		info={<DataAI>{taxonomy?.generated}</DataAI>}

	>

		<TileFrame placeholder={Taxonomies[icon]} as={({

			title,
			description,

			publisher,
			source,

			rights,
			license,
			accessRights,

			hasConcept,
			hasTopConcept

		}) => <>

			<dfn>{toTextString(title)}</dfn>

			{description && <TileMark>{toTextString(description)}</TileMark>}

			<TileInfo center={true}>{{

				"Publisher": publisher && <TileLink>{publisher}</TileLink>,
				"Copyright": rights,

				"License": license?.length === 1 && <TileLink>{license[0]}</TileLink>

					|| license?.length && <ul>{license.map(license =>
						<li key={license.id}><TileLink>{license}</TileLink></li>
					)}</ul>,

				"Source": source && <TileLink>{source.id}</TileLink>,
				"Access": accessRights && <TileMark>{toTextString(accessRights)}</TileMark>


			}}</TileInfo>

			{
				keywords || hasTopConcept && hasTopConcept.some(concept => concept.narrower)
					? <div style={{ marginTop: "1.5em", marginBottom: "1em" }}>
						<TileSearch placeholder={"Concepts"}>{[keywords, setKeywords]}</TileSearch>
					</div>
					: <hr/>
			}

			{hasConcept ? <TileSKOSConcepts>{hasConcept}</TileSKOSConcepts>
				: hasTopConcept ? <TileSKOSConcepts>{hasTopConcept}</TileSKOSConcepts>
					: <div><TileHint>{Taxonomies[icon]} No Matches</TileHint></div>
			}

		</>}>{taxonomy}</TileFrame>

	</DataPage>;

}



