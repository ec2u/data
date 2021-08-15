/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useRouter } from "@metreeca/tile/nests/router";
import { X } from "@metreeca/tile/tiles/icon";
import * as React from "react";
import { createElement } from "react";
import { ToolPage } from "../tiles/page";
import "./none.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolNone() {

	const { swap }=useRouter();

	return (

		<ToolPage

			item="404 | Not Found"

			menu={<button title="Remove from History" onClick={() => swap("/")}><X/></button>}

		>

			{createElement("tool-none", {})}

		</ToolPage>

	);

}
