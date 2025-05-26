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
import { Taxonomies } from "@ec2u/data/pages/taxomomies/taxonomies";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { date, toDateString } from "@metreeca/core/date";
import { id } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useRouter } from "@metreeca/data/contexts/router";
import { useAsset } from "@metreeca/data/hooks/asset";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { EyeIcon } from "@metreeca/view/widgets/icon";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import React from "react";

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

	version: optional(string),
	created: optional(date),
	issued: optional(date),
	modified: optional(date),

	rights: optional(string),
	accessRights: optional(text),

	license: multiple({
		id: required(id),
		label: required(text)
	}),

	isDefinedBy: optional(id)

});


export function DataDataset() {

	const [route, setRoute]=useRouter();

	const [dataset]=useResource({
		...Dataset, id: route === "/datasets/" ? "/"
			: route.replace(/^\/datasets\/(?<name>\w*?)$/, "/$<name>/")
	});

	const model=useAsset(dataset?.isDefinedBy);


	function close() {
		dataset && setRoute(dataset.id);
	}


	return <DataPage

		name={[Books, dataset && toTextString(dataset.alternative || dataset.title)]}

		menu={(dataset?.id === Datasets.id || dataset?.id === Taxonomies.id || dataset?.issued) && <button

            onClick={close}

        ><EyeIcon/></button>}

		tray={<TileFrame as={({

			publisher,
			source,

			license,
			rights,

			isDefinedBy

		}) => <>

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

			</>}>{dataset}</TileFrame>

			{isDefinedBy && <>

                <TileMark meta={"toc"}>{model}</TileMark>

            </>}

		</>}>{dataset}</TileFrame>}

	>

		<TileFrame placeholder={Datasets[icon]} as={({

			publisher,
			source,

			rights,
			license,
			accessRights,

			description,

			isDefinedBy

		}) => <>

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

			{isDefinedBy && <>

                <TileMark>{model}</TileMark></>

			}


		</>}>{dataset}</TileFrame>

	</DataPage>;

}
