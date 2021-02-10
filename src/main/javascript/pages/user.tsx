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

import { css } from "emotion";
import React from "react";
import { LogOut } from "react-feather";
import ToolPage from "../tiles/page";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolUser() {
	return (

		<ToolPage

			menu={<button title="Log out"><LogOut/></button>}

		>

			<ul className={css`& {

				label: tool-user;
				
				position: absolute;
				left: 0;
				right: 0;
				top:0;
				bottom: 0;
				
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				
				padding: 0;
				margin: 0;
				
				font-size: 200%;
				color: #999;
								
				> li {
				
					list-style: none;
				
				}
					
			}`}>

				<li>Tino Faussone</li>
				<li>tino.faussone@example.edu</li>
				<li>University of Example</li>

			</ul>

		</ToolPage>

	);

}
