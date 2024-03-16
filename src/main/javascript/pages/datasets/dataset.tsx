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

import { Datasets } from "@ec2u/data/pages/datasets/datasets";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, optional, required } from "@metreeca/core";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { DoneIcon, InfoIcon } from "@metreeca/view/widgets/icon";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React from "react";


function isMeta(route: string) {
	return route.startsWith("/datasets/");
}

function toMeta(route: string) {
	return route.replace(/^\/(?<name>\w*)\/?$/, "/datasets/$<name>");
}

function toData(route: string) {
	return route === "/datasets/" ? "/" : route.replace(/^\/datasets\/(?<name>\w*?)$/, "/$<name>/");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Dataset=immutable({

	id: "/datasets/*",

	label: required(local),
	comment: optional(local),

	title: { "en": "Dataset" },
	alternative: optional(local),
	description: optional(local),

	license: optional({
		id: required(id),
		label: required(local)
	}),

	rights: optional(string),
	accessRights: optional(local),

	entities: required(integer),

	isDefinedBy: optional(id)

});


export function DataMeta() {

	const [route, setRoute]=useRouter();

	const data=!isMeta(route);

	return <button title={data ? "View Dataset Metadata" : "View Dataset Content"}

		onClick={() => setRoute(data ? toMeta(route) : toData(route))}

		style={{

			color: "var(--tool--color-label)",
			transform: "scale(0.75)"

		}}

	>{data ? <InfoIcon/> : <DoneIcon/>}</button>;

}

export function DataDataset() {

	const [route]=useRouter();

	const [dataset]=useResource({ ...Dataset, id: toData(route) });

	return <DataPage

		name={dataset && toLocalString(dataset.alternative || dataset.title)}

		menu={<DataMeta/>}

		tray={<ToolFrame as={({

			id,

			entities,

			license,
			rights,

			isDefinedBy

		}) => <>

			<ToolInfo>{{

				"Entities": <span>{toIntegerString(entities)}</span>

			}}</ToolInfo>

			<ToolInfo>{{

				"License": license && <ToolLink>{license}</ToolLink>,
				"Rights": rights && <span>{rights}</span>

			}}</ToolInfo>

			{isDefinedBy && <>

                <hr/>

                <nav><ToolMark toc>{isDefinedBy}</ToolMark></nav>

            </>}

		</>}>{dataset}</ToolFrame>}

	>

		<ToolFrame placeholder={Datasets[icon]} as={({

			description,

			isDefinedBy

		}) => <>

			{description && <ToolMark>{toLocalString(description)}</ToolMark>}
			{isDefinedBy && <ToolMark>{isDefinedBy}</ToolMark>}


		</>}>{dataset}</ToolFrame>

	</DataPage>;

}
