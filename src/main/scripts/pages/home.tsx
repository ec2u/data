/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Custom } from "@metreeca/tile/tiles/custom";
import { Bookmark, BookOpen, Home, MapPin, Tool, Users } from "@metreeca/tile/tiles/icon";
import { ToolSearch } from "@metreeca/tile/tiles/search";
import ToolFacet from "../tiles/facet";
import ToolPage from "../tiles/page";
import "./home.less";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolHome() {
	return (

		<ToolPage

			name={<ToolSearch path="" placeholder="Discover Skills and Resources" state={[{}, () => {}]}/>}

			side={(
				<>
					<ToolFacet name={"University"}/>
				</>
			)}

		>

			<Custom tag="tool-home">

				<ul>
					<li><span>7</span><a href="/universities/"><MapPin/></a><span>Universities</span></li>
					<li><span>99</span><a href="/structures/"><Home/></a><span>Structures</span></li>
					<li><span>123</span><a href="/structures/"><Bookmark/></a><span>Subjects</span></li>
					<li><span>2'300</span><a href="/structures/"><Tool/></a><span>Projects</span></li>
					<li><span>4'200</span><a href="/structures/"><Users/></a><span>People</span></li>
					<li><span>567'890</span><a href="/structures/"><BookOpen/></a><span>Publications</span></li>
				</ul>

			</Custom>

		</ToolPage>

	);

}
