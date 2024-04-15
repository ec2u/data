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

import { Universities } from "@ec2u/data/pages/universities/universities";
import { ec2u } from "@ec2u/data/views";
import { DataName } from "@ec2u/data/views/name";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, optional, required } from "@metreeca/core";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { year } from "@metreeca/core/year";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";


export const University=immutable({

	id: required("/universities/{code}"),

	label: required(local),
	depiction: required(id),

	prefLabel: required(local),
	definition: required(local),

	inception: optional(year),
	students: optional(integer),

	country: optional({
		id: required(id),
		label: required(local)
	}),

	city: optional({
		id: required(id),
		label: required(local)
	})

});


export function DataUniversity() {

	const [route]=useRouter();

	const [university]=useResource(University);

	const [stats]=useResource(immutable({

		id: required("/resources/"),

		members: [{

			"dataset": required({
				id: required(id),
				label: required(local),
			}),

			"resources=count:": required(integer),

			"?partner": [route],
			"?dataset.issued": []

		}]

	}));

	return <DataPage name={[Universities, university]}

		tray={<ToolFrame as={({

			inception,
			students,
			country,
			city

		}) => <>

			<ToolInfo>{{

				"Country": country && <ToolLink>{country}</ToolLink>,
				"City": city && <ToolLink>{city}</ToolLink>

			}}</ToolInfo>

			<ToolInfo>{{

				"Inception": inception && inception.substring(0, 4) || "-",
				"Students": students && toIntegerString(students)

			}}</ToolInfo>

			<ToolInfo>{stats?.members?.slice()
				?.sort(({ resources: x }, { resources: y }) => x - y)
				?.map(({ dataset, resources }) => ({

					label: <ToolLink filter={[dataset, { partner: university }]}>{{
						id: dataset.id,
						label: ec2u(dataset.label)
					}}</ToolLink>,

					value: toIntegerString(resources)

				}))

			}</ToolInfo>

		</>}>{university}</ToolFrame>}

	>

		<ToolFrame placeholder={Universities[icon]} as={({

			label,
			depiction,

			definition,
			prefLabel

		}) => <>

			<img className={"right"} src={depiction} alt={`Image of ${toLocalString(label)}`}/>

			<DataName>{{ label, title: prefLabel }}</DataName>

			<p>{toLocalString(definition)}</p>

		</>}>{university}</ToolFrame>

	</DataPage>;

}


