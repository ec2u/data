/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useRouter } from "@metreeca/tile/nests/router";
import { X } from "@metreeca/tile/tiles/icon";
import * as React from "react";
import { ToolPage } from "../tiles/page";
import "./about.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolAbout() {

	const { back }=useRouter();

	return ( // !!! populate from html metadata

		<ToolPage item={"v1.10.2+20210710"}

			menu={<button title="Close" onClick={back}><X/></button>}

		>

		</ToolPage>

	);

}
