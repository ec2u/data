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
import React from "react";
import { immutable, optional, required } from "../../../../../../../Products/Tool/code/core";
import { id } from "../../../../../../../Products/Tool/code/core/id";
import { integer, toIntegerString } from "../../../../../../../Products/Tool/code/core/integer";
import { local, toLocalString } from "../../../../../../../Products/Tool/code/core/local";
import { string } from "../../../../../../../Products/Tool/code/core/string";
import { useRouter } from "../../../../../../../Products/Tool/code/data/contexts/router";
import { useAsset } from "../../../../../../../Products/Tool/code/data/hooks/asset";
import { useResource } from "../../../../../../../Products/Tool/code/data/models/resource";
import { icon } from "../../../../../../../Products/Tool/code/view";
import { ToolFrame } from "../../../../../../../Products/Tool/code/view/lenses/frame";
import { DoneIcon, InfoIcon } from "../../../../../../../Products/Tool/code/view/widgets/icon";
import { ToolInfo } from "../../../../../../../Products/Tool/code/view/widgets/info";
import { ToolLink } from "../../../../../../../Products/Tool/code/view/widgets/link";
import { ToolMark } from "../../../../../../../Products/Tool/code/view/widgets/mark";


function isMeta(route: string) {
	return route.startsWith("/schemas/");
}

function toMeta(route: string) {
	return route.replace(/^\/(?<name>\w*)\/?$/, "/schemas/$<name>");
}

function toData(route: string) {
	return route === "/schemas/" ? "/" : route.replace(/^\/schemas\/(?<name>\w*?)$/, "/$<name>/");
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Meta=immutable({

	id: "/schemas/*",

	title: required(local),
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


export function DataInfo() {

	const [route, setRoute]=useRouter();

	const data=!isMeta(route);

	return <button title={data ? "View Dataset Metadata" : "View Dataset Catalog"}

		onClick={() => setRoute(data ? toMeta(route) : toData(route))}

		style={{

			color: "var(--tool--color-label)",
			transform: "scale(0.75)"

		}}

	>{data ? <InfoIcon/> : <DoneIcon/>}</button>;

}

export function DataMeta() {

	const [route]=useRouter();

	const [dataset]=useResource({ ...Meta, id: toData(route) });

	const model=useAsset(dataset?.isDefinedBy);


	return <DataPage

		name={dataset && toLocalString(dataset.alternative || dataset.title)}

		menu={<DataInfo/>}

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

                <nav><ToolMark meta={"toc"}>{model}</ToolMark></nav>

            </>}

		</>}>{dataset}</ToolFrame>}

	>

		<ToolFrame placeholder={Datasets[icon]} as={({

			description,

			isDefinedBy

		}) => <>

			{description && <ToolMark>{toLocalString(description)}</ToolMark>}
			{isDefinedBy && <ToolMark>{model}</ToolMark>}


		</>}>{dataset}</ToolFrame>

	</DataPage>;

}
