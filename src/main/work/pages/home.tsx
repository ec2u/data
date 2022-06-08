/*
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
 */

import { freeze } from "@metreeca/tool/bases";
import { Home as Site } from "@metreeca/tool/tiles/icon";
import * as React from "react";
import { DataPage } from "../tiles/page";


export const Home=freeze({

	id: "/",

	label: { en: "Connect Centre" },

	contains: [{

		id: "",

		label: "",
		image: "",
		comment: "",

		university: {
			id: "",
			label: ""
		}

	}]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function DataHome() {
	return (

		<DataPage item={"European Campus of City-Universities"}

			menu={<a href={"https://ec2u.eu/"} target={"_blank"} title={`About EC2U`}><Site/></a>}>

			{<img src={"/blobs/ec2u.png"} alt={"EC2U Locations"} style={{ width: "100%", maxWidth: "50em" }}/>}

		</DataPage>

	);
}
