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
import { LogOut } from "preact-feather";
import { Custom } from "../tiles/custom";
import ToolPage from "../tiles/page";
import "./user.less";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolUser() {
	return (

		<ToolPage

			menu={<button title="Log out"><LogOut/></button>}

		>
			<Custom tag="tool-user">

				<ul>

					<li>Tino Faussone</li>
					<li>tino.faussone@example.edu</li>
					<li>University of Example</li>

				</ul>

			</Custom>

		</ToolPage>

	);

}
