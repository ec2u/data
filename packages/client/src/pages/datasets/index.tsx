/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { Button } from "@metreeca/tile-cell/button";
import { Link } from "@metreeca/tile-cell/link";
import { Page } from "../../tiles/page.js";
import { Icon } from "@metreeca/tile-cell/icon";


export const DatasetsPath = "/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Datasets() {

	return <Page

		head={"European Campus of City-Universities"}
		menu={<Button look={"subtle"} icon={<Icon.Help/>} title={"Help"}></Button>}

	/>;

}
