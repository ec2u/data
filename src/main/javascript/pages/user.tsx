/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
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
