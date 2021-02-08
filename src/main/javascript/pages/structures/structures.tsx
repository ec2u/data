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

import React from "react";
import { NavLink } from "react-router-dom";
import ToolCard from "../../tiles/card";
import ToolFacet from "../../tiles/facet";
import ToolPage from "../../tiles/page";
import ToolSearch from "../../tiles/search";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolStructures() {
	return (

		<ToolPage

			name={<ToolSearch placeholder="Discover Structures"/>}

			side={<>
				<ToolFacet name={"University"}/>
				<ToolFacet name={"Type"}/>
			</>}

		>

			<ToolCard

				site={<NavLink to="/structures/1234">University of Nowhere</NavLink>}
				name={<NavLink to="/structures/1234">Proin Department</NavLink>}

				tags={[<NavLink to="/structures/">department</NavLink>]}

			>

				Rhoncus dolor purus non enim. In mollis nunc sed id semper risus. In pellentesque massa placerat duis.
				Rutrum tellus pellentesque eu tincidunt tortor aliquam nulla. Sed nisi lacus sed viverra tellus in hac.
				Pellentesque habitant morbi tristique senectus et. Purus gravida quis blandit turpis cursus in hac.
				Facilisi nullam vehicula ipsum a arcu. Pretium quam vulputate dignissim suspendisse in. Adipiscing elit
				pellentesque habitant morbi tristique senectus et. Gravida cum sociis natoque penatibus. Feugiat nisl
				pretium fusce id velit ut. Pulvinar mattis nunc sed blandit. Senectus et netus et malesuada fames ac
				turpis egestas. Ultrices vitae auctor eu augue ut.

			</ToolCard>

			<ToolCard

				site={<NavLink to="/structures/1234">University of Nowhere</NavLink>}
				name={<NavLink to="/structures/1234">Proin Department</NavLink>}

				tags={[<NavLink to="/structures/">university</NavLink>, <NavLink to="/structures/">department</NavLink>]}

			>

				Rhoncus dolor purus non enim. In mollis nunc sed id semper risus. In pellentesque massa placerat duis.
				Rutrum tellus pellentesque eu tincidunt tortor aliquam nulla. Sed nisi lacus sed viverra tellus in hac.
				Pellentesque habitant morbi tristique senectus et. Purus gravida quis blandit turpis cursus in hac.
				Facilisi nullam vehicula ipsum a arcu. Pretium quam vulputate dignissim suspendisse in. Adipiscing elit
				pellentesque habitant morbi tristique senectus et. Gravida cum sociis natoque penatibus. Feugiat nisl
				pretium fusce id velit ut. Pulvinar mattis nunc sed blandit. Senectus et netus et malesuada fames ac
				turpis egestas. Ultrices vitae auctor eu augue ut.

			</ToolCard>

		</ToolPage>

	);

}
