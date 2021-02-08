/*
 * Copyright © 2021-2021 EC2U Consortium
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
import { Frown, X } from "react-feather";
import { Link } from "react-router-dom";
import ToolPage from "../tiles/page";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolNone() {
	return (

		<ToolPage

			name={<Link to=".">404</Link>}
			menu={<button title="Remove from History"><X/></button>}

		>

			<div className={css`& {

				label: tool-none;
				
				display: grid;
				width: 100%;
				height: 100%;
				
				> * {
				
					margin: auto;
				
				}
					
			}`}>

				<Frown size="4em" style={{ strokeWidth: 1, color: "#CCC" }}/>

			</div>

		</ToolPage>

	);

}
