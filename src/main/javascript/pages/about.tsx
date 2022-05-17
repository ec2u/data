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
import { useRouter } from "@metreeca/tool/nests/router";
import { CancelIcon } from "@metreeca/tool/tiles/page";
import * as React from "react";
import { DataPage } from "../tiles/page";
import "./about.css";
import { Home } from "./home";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const About=freeze({

	id: "/about"

});


export default function DataAbout() {

	const { back }=useRouter();

	return ( // !!! populate from html metadata

		<DataPage item={string(Home.label)}

			menu={<button title="Close" onClick={back}><CancelIcon/></button>}

		>

			<span>v1.10.2+20210710</span>

		</DataPage>

	);

}
