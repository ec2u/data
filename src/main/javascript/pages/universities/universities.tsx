/***********************************************************************************************************************
 * Copyright © 2020-2022 EC2U Alliance
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
 **********************************************************************************************************************/

import { freeze, string } from "@metreeca/tool/bases";
import { useEntry } from "@metreeca/tool/hooks/queries/entry";
import { useRouter } from "@metreeca/tool/nests/router";
import { ToolSpin } from "@metreeca/tool/tiles/spin";
import * as React from "react";
import { useEffect } from "react";
import { DataCard } from "../../tiles/card";
import { DataPage } from "../../tiles/page";


export const Universities=freeze({

	id: "/universities/",

	label: { en: "Universities" },

	contains: [{

		id: "",

		image: "",
		label: { en: "" },
		comment: { en: "" },

		country: {
			id: "",
			label: { en: "" }
		}

	}]

});


export function DataUniversities() {

	const { name }=useRouter();

	const [{ fetch, frame, error }]=useEntry("", Universities);


	useEffect(() => { name(string(Universities.label)); });


	return <DataPage item={string(Universities.label)}

		menu={fetch(abort => <ToolSpin abort={abort}/>)}

	>

		{frame(({ contains }) => contains.map(({ id, label, image, comment, country }) => (

			<DataCard key={id}

				name={<a href={id}>{string(label)}</a>}
				icon={image}
				tags={<span>{string(country)}</span>}

			>
				{string(comment)}

			</DataCard>

		)))}

		{error(error => <span>{error.status}</span>)} {/* !!! */}

	</DataPage>;

}
