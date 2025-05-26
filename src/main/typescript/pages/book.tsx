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

import { DataPage, NotFound } from "@ec2u/data/views/page";
import { immutable, required } from "@metreeca/core";
import { useRouter } from "@metreeca/data/contexts/router";
import { useAsset } from "@metreeca/data/hooks/asset";
import { TileHint } from "@metreeca/view/widgets/hint";
import { NotFoundIcon } from "@metreeca/view/widgets/icon";
import { TileMark } from "@metreeca/view/widgets/mark";
import * as React from "react";


export const Books=immutable({

	id: "/handbooks/",

	label: required({
		"": "Handbooks"
	})

});

export const Book=immutable({

	id: "/handbooks/*"

});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataBook() {

	const text=useAsset("");

	return <DataPage

		name={[Books, text.code === 200 // !!! 404 vs other errors

			? <TileMark key={"title"} meta={"title"}>{text}</TileMark>
			: NotFound

		]}

		tray={text.code === 200 // !!! 404 vs other errors

			? <TileMark meta={"toc"}>{text}</TileMark>
			: null

		}

	>{text.code === 200 // !!! 404 vs other errors

		? <TileMark>{text}</TileMark>
		: <TileHint><NotFoundIcon/></TileHint>

	}</DataPage>;

}
