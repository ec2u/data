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


import { Fragment, h } from "preact";
import { Bookmark, BookOpen, Home, Tool, Users } from "preact-feather";
import { Link } from "preact-router";
import { Custom } from "../tiles/custom";
import ToolFacet from "../tiles/facet";
import ToolPage from "../tiles/page";
import ToolSearch from "../tiles/search";
import "./home.less";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolHome() {
	return (

		<ToolPage

			name={<ToolSearch placeholder="Discover Skills and Resources"/>}

			side={(
				<Fragment>
					<ToolFacet name={"University"}/>
					<ToolFacet name={"Collection"}/>
				</Fragment>
			)}

		>

			<Custom tag="tool-home">

				<ul>
					<li><span>99</span><Link href="/structures/"><Home/></Link><span>Structures</span></li>
					<li><span>123</span><Link href="/structures/"><Bookmark/></Link><span>Subjects</span></li>
					<li><span>2'300</span><Link href="/structures/"><Tool/></Link><span>Projects</span></li>
					<li><span>4'200</span><Link href="/structures/"><Users/></Link><span>People</span></li>
					<li><span>567'890</span><Link href="/structures/"><BookOpen/></Link><span>Publications</span>
					</li>
				</ul>

			</Custom>

		</ToolPage>

	);

}
