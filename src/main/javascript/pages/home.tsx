/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { h } from "preact";
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

			side={<ToolFacet name={"University"}/>}

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
