/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { LogOut } from "@metreeca/tile/tiles/icon";
import { ToolPlaceholder } from "@metreeca/tile/tiles/placeholder";
import { ToolPage } from "../tiles/page";
import "./user.css";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolUser() {
	return <ToolPage menu={<button title="Log out"><LogOut/></button>}>

		<ToolPlaceholder>

			<ul>

				<li>Tino Faussone!!</li>
				<li>tino.faussone@example.edu</li>
				<li>University of Example</li>

			</ul>

		</ToolPlaceholder>

	</ToolPage>;

}
