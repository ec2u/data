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

import { Books } from "@ec2u/data/pages/book";
import { Datasets } from "@ec2u/data/pages/datasets/datasets";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { date } from "@metreeca/core/date";
import { id } from "@metreeca/core/id";
import { integer, toIntegerString } from "@metreeca/core/integer";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useRouter } from "@metreeca/data/contexts/router";
import { useAsset } from "@metreeca/data/hooks/asset";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { EyeIcon, HelpCircleIcon } from "@metreeca/view/widgets/icon";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import React from "react";


function toData(route: string) {
	return route === "/datasets/" ? "/" : route.replace(/^\/datasets\/(?<name>\w*?)$/, "/$<name>/");
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Dataset=immutable({

	id: "/datasets/*",

	title: required(text),
	alternative: optional(text),
	description: optional(text),

	publisher: optional({
		id: required(id),
		label: required(text)
	}),

	source: optional({
		id: required(id),
		label: required(text)
	}),

	issued: optional(date),

	rights: optional(string),
	accessRights: optional(text),

	license: multiple({
		id: required(id),
		label: required(text)
	}),

	entities: required(integer),

	isDefinedBy: optional(id)

});


export function DataInfo() {

	const [route, setRoute]=useRouter();

	const [resource]=useResource({ id: route, isDefinedBy: optional(id) });

	const isDefinedBy=resource?.isDefinedBy;

	function open() {
		isDefinedBy && setRoute(isDefinedBy);
	}

	return isDefinedBy && <button title={"View Dataset Docs"}

        onClick={open}

        style={{
			transform: "scale(0.75)"
		}}

    >{<HelpCircleIcon/>}</button>;

}

export function DataMeta() {

	const [route, setRoute]=useRouter();

	const [dataset]=useResource({ ...Dataset, id: toData(route) });

	const model=useAsset(dataset?.isDefinedBy);


	function close() {
		dataset && setRoute(dataset.id);
	}


	return <DataPage

		name={[Books, dataset && toTextString(dataset.alternative || dataset.title)]}

		menu={(dataset?.id === "/" || dataset?.issued) && <button

            onClick={close}

        ><EyeIcon/></button>}

		tray={<TileFrame as={({

			publisher,
			source,

			license,
			rights,

			entities,

			isDefinedBy

		}) => <>


			<TileInfo>{{

				"Publisher": publisher && <TileLink>{publisher}</TileLink>,
				"Source": source && <TileLink>{source}</TileLink>,

				"Rights": rights && <span>{rights}</span>,

				"License": license?.length && <ul>{license.map(license =>
					<li key={license.id}><TileLink>{license}</TileLink></li>
				)}</ul>

			}}</TileInfo>

			<TileInfo>{{

				"Resources": toIntegerString(entities)

			}}</TileInfo>


			{isDefinedBy && <>

                <hr/>

                <TileMark meta={"toc"}>{model}</TileMark>

            </>}

		</>}>{dataset}</TileFrame>}

	>

		<TileFrame placeholder={Datasets[icon]} as={({

			description,

			isDefinedBy

		}) => <>

			{description && <TileMark>{toTextString(description)}</TileMark>}
			{isDefinedBy && <TileMark>{model}</TileMark>}


		</>}>{dataset}</TileFrame>

	</DataPage>;

}
