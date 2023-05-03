/*
 * Copyright © 2020-2023 EC2U Alliance
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
import { immutable, multiple, optional } from "@metreeca/core";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { toLocalString } from "@metreeca/core/local";
import { title } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { ToolCard } from "@metreeca/view/widgets/card";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import * as React from "react";
import { useEffect } from "react";


export const University=immutable({

	id: "/universities/{code}",

	image: "",
	label: { "*": "" },
	comment: { "*": "" },

	schac: "",

	// inception: optional(dateTime),
	students: optional(integer),

	country: optional({
		id: "",
		label: { "*": "" }
	}),

	location: optional({
		id: "",
		label: { "*": "" }
	}),

	subsets: multiple({

		dataset: {
			id: "",
			label: { "*": "" }
		},

		entities: 0

	})

});


export function DataUniversity() {

	const [university]=useResource({ ...University, id: "" });

	useEffect(() => { title(university); }, [university]);


	return <DataPage name={[Universities, university]}

		tray={university && DataUniversityInfo(university)}

	>{
		university && DataUniversityBody(university)

	}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function DataUniversityInfo({

	id,

	// inception,
	students,
	country,
	location,
	subsets

}: typeof University) {

	return <>

		<ToolInfo>{{

			"Country": country && <ToolLink>{country}</ToolLink>,
			"City": location && <ToolLink>{location}</ToolLink>

		}}</ToolInfo>

		<ToolInfo>{{

			// !!! "Inception": inception && inception.substring(0, 4) || "-",
			"Students": students && toIntegerString(students)

		}}</ToolInfo>

		<ToolInfo>{subsets?.slice()

			?.sort(({ entities: x }, { entities: y }) => x - y)
			?.map(({ dataset, entities }) => ({

				label: <ToolLink filter={[dataset, { university: id }]}>{{
					id: dataset.id,
					label: ec2u(dataset.label)
				}}</ToolLink>,

				value: toIntegerString(entities)

			}))

		}</ToolInfo>

	</>;

}

function DataUniversityBody({

	image,
	label,
	comment

}: typeof University) {

	return <ToolCard side={"end"} wrap

		image={image && <img src={image} alt={`Image of ${toLocalString(label)}`}/>}

	>

		{toLocalString(comment)}

	</ToolCard>;

}
