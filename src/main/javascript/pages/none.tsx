/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */


import { h } from "preact";
import { X } from "preact-feather";
import { route } from "preact-router";
import { Custom } from "../tiles/custom";
import ToolPage from "../tiles/page";
import "./none.less";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolNone() {
	return (

		<ToolPage

			name="404 | Not Found"

			menu={<button title="Remove from History" onClick={() => route("/", true)}><X/></button>}

		>

			<Custom tag={"tool-none"}/>

		</ToolPage>

	);

}
