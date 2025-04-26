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

import { Universities } from "@ec2u/data/pages/universities/universities";
import { ec2u } from "@ec2u/data/views";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, optional, required, virtual } from "@metreeca/core";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { text, toTextString } from "@metreeca/core/text";
import { year } from "@metreeca/core/year";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import * as React from "react";


export const University=immutable({

	id: required("/universities/{code}"),

	label: required(text),
	depiction: required(id),

	prefLabel: required(text),
	definition: required(text),

	inception: optional(year),
	students: optional(integer),

	country: optional({
		id: required(id),
		label: required(text)
	}),

	city: optional({
		id: required(id),
		label: required(text)
	})

});


export function DataUniversity() {

	const [route]=useRouter();

	const [university]=useResource(University);

	const [stats]=useResource(immutable({

		id: required("/resources/"),

		members: [{

			collection: required({
				id: required(id),
				alternative: required(text)
			}),

			resources: virtual(required(integer)),
			"resources=count:": required(integer),

			"?university": [route]

		}]

	}));

	return <DataPage name={[Universities, {}]}

		tray={<TileFrame as={({

			inception,
			students,
			country,
			city

		}) => <>

			<TileInfo>{{

				"Country": country && <TileLink>{country}</TileLink>,
				"City": city && <TileLink>{city}</TileLink>

			}}</TileInfo>

			<TileInfo>{{

				"Inception": inception && inception.substring(0, 4),
				"Students": students && toIntegerString(students)

			}}</TileInfo>

			<TileInfo>{stats?.members?.slice()
				?.sort(({ resources: x }, { resources: y }) => x - y)
				?.map(({ collection, resources }) => ({

					label: <TileLink filter={[collection, { university }]}>{{
						id: collection.id,
						label: ec2u(collection.alternative)
					}}</TileLink>,

					value: toIntegerString(resources)

				}))

			}</TileInfo>

		</>}>{university}</TileFrame>}

	>

		<TileFrame placeholder={Universities[icon]} as={({

			label,
			depiction,

			definition,
			prefLabel

		}) => <>

			<img className={"right"} src={depiction} alt={`Image of ${toTextString(label)}`}/>

			<dfn>{toTextString(prefLabel)}</dfn>

			<p>{toTextString(definition)}</p>

		</>}>{university}</TileFrame>

	</DataPage>;

}


