/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { createElement } from "react";
import { useRouter } from "../@metreeca/tool/nests/router";
import { CancelIcon } from "../@metreeca/tool/tiles/page";
import { DataPage } from "../tiles/page";
import { Home } from "./home";
import "./none.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolNone() {

	const { swap }=useRouter();

	return (

		<DataPage item="404 | Not Found"

			menu={<button title="Remove from History" onClick={() => swap(Home.id)}><CancelIcon/></button>}

		>

			{createElement("tool-none", {})}

		</DataPage>

	);

}
