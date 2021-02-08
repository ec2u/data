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
import { Bookmark, BookOpen, Home, Tool, Users } from "react-feather";
import { NavLink } from "react-router-dom";
import ToolFacet from "../tiles/facet";
import ToolPage from "../tiles/page";
import ToolSearch from "../tiles/search";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolHome() {
	return (

		<ToolPage

			name={<ToolSearch placeholder="Discover Skills and Resources"/>}
			// menu={<button><Edit/></button>}

			side={<>
				<ToolFacet name={"University"}/>
				<ToolFacet name={"Collection"}/>
			</>}

		>

			<ul className={css`& {

				display: table;
				margin: 10% auto;
				font-size: 200%;
				
				> li {
				
					list-style: none;
					display: table-row;
							
					> * {
						display: table-cell;
						padding: 0 0.25em;
					}
				
					> :first-child {
						text-align: right;
					}
				
					> :last-child {
						width: 60%;
						text-align: left;
					}
	
				}
		
			}`}>
				<li><span>99</span><NavLink to="/"><Home/></NavLink><span>Structures</span></li>
				<li><span>123</span><NavLink to="/"><Bookmark/></NavLink><span>Subjects</span></li>
				<li><span>2'300</span><NavLink to="/"><Tool/></NavLink><span>Projects</span></li>
				<li><span>4'200</span><NavLink to="/"><Users/></NavLink><span>People</span></li>
				<li><span>567'890</span><NavLink to="/"><BookOpen/></NavLink><span>Publications</span></li>
			</ul>


		</ToolPage>

	);

}
