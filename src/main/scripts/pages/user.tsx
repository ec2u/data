/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Custom } from "@metreeca/tile/tiles/custom";
import { LogOut } from "@metreeca/tile/tiles/icon";
import ToolPage from "../tiles/page";
import "./user.css";

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
