/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { swap } from "@metreeca/tile/nests/router";
import { Custom } from "@metreeca/tile/tiles/custom";
import { X } from "@metreeca/tile/tiles/icon";
import ToolPage from "../tiles/page";
import "./none.less";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolNone() {
	return (

		<ToolPage

			name="404 | Not Found"

			menu={<button title="Remove from History" onClick={() => swap("/")}><X/></button>}

		>

			<Custom tag={"tool-none"}/>

		</ToolPage>

	);

}
