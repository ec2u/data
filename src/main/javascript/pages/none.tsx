/*
 * Copyright © 2021 EC2U Consortium
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


import { h } from "preact";
import { X } from "preact-feather";
import ToolPage from "../tiles/page";
import "./none.less";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolNone() {
	return (

		<ToolPage

			menu={<button title="Remove from History"><X/></button>}

		>

			<span>404 | Not Found :-(</span>

		</ToolPage>

	);

}
