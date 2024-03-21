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

import { DataPage } from "@ec2u/data/views/page";
import { immutable, required } from "@metreeca/core";
import { useRouter } from "@metreeca/data/contexts/router";
import { ToolMark } from "@metreeca/view/widgets/mark";
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataBook() {

	const [route]=useRouter();

	const path=route.endsWith("/") ? `${route}/index.md` : `${route}.md`;

	return <DataPage

		name={[Books, <ToolMark key={"title"} meta={"title"}>{path}</ToolMark>]}

		tray={

			<ToolMark meta={"toc"}>{path}</ToolMark>

		}

	>

		<ToolMark>{path}</ToolMark>

	</DataPage>;

}
