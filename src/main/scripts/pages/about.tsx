/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { freeze, string } from "../@metreeca/tool/bases";
import { useRouter } from "../@metreeca/tool/nests/router";
import { CancelIcon } from "../@metreeca/tool/tiles/page";
import { DataPage } from "../tiles/page";
import "./about.css";
import { Home } from "./home";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const About=freeze({

	id: "/about"

});


export default function DataAbout() {

	const { back }=useRouter();

	return ( // !!! populate from html metadata

		<DataPage item={string(Home.label)}

			menu={<button title="Close" onClick={back}><CancelIcon/></button>}

		>

			<span>v1.10.2+20210710</span>

		</DataPage>

	);

}
