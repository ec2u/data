/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */


import { h } from "preact";
import { X } from "preact-feather";
import ToolPage from "../tiles/page";
import "./none.less";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolNone() {
	return (

		<ToolPage

			menu={<button title="Remove from History"><X/></button>}

		>

			<span>404 | Not Found :-(</span>

		</ToolPage>

	);

}
