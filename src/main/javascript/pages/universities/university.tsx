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
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { iri } from "@metreeca/core/iri";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";


export const University=immutable({

	id: required("/universities/{code}"),

	image: required(iri),
	label: required(local),
	comment: required(local),

	schac: required(string),

	// inception: optional(date), // !!! native non-value type
	students: optional(integer),

	country: optional({
		id: required(iri),
		label: required(local)
	}),

	location: optional({
		id: required(iri),
		label: required(local)
	}),

	subsets: multiple({

		dataset: {
			// id: required(iri),
			// label: required(local)
		},

		entities: required(integer)

	})

});


export function DataUniversity() {

	const [university]=useResource({ ...University, id: "" });

	return <DataPage name={[Universities, university]}

		tray={<ToolFrame as={({

			// !!! inception,
			students,
			country,
			location
			// subsets

		}) => <>

			<ToolInfo>{{

				"Country": country && <ToolLink>{country}</ToolLink>,
				"City": location && <ToolLink>{location}</ToolLink>

			}}</ToolInfo>

			<ToolInfo>{{

				// !!! "Inception": inception && inception.substring(0, 4) || "-",
				"Students": students && toIntegerString(students)

			}}</ToolInfo>

			{/* <ToolInfo>{subsets?.slice()

			 ?.sort(({ entities: x }, { entities: y }) => x - y)
			 ?.map(({ dataset, entities }) => ({

			 label: <ToolLink filter={[dataset, { university: id }]}>{{
			 id: dataset.id,
			 label: ec2u(dataset.label)
			 }}</ToolLink>,

			 value: toIntegerString(entities)

			 }))

			 }</ToolInfo> */}

		</>}>{university}</ToolFrame>}

	>

		<ToolFrame placeholder={Universities[icon]} as={({

			image,
			label,
			comment

		}) => <>

			<img className={"right"} src={image} alt={`Image of ${toLocalString(label)}`}/>

			<p>{toLocalString(comment)}</p>

		</>}>{university}</ToolFrame>

	</DataPage>;

}