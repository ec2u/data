/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { freeze } from "@metreeca/tool/bases";
import { Home as Site } from "@metreeca/tool/tiles/icon";
import * as React from "react";
import { DataPage } from "../tiles/page";


export const Home=freeze({

	id: "/",

	label: { en: "Connect Centre" },

	contains: [{

		id: "",

		label: "",
		image: "",
		comment: "",

		university: {
			id: "",
			label: ""
		}

	}]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function DataHome() {
	return (

		<DataPage item={"Connect Centre"}

			menu={<a href={"https://ec2u.eu/"} target={"_blank"} title={`About EC2U`}><Site/></a>}>

			{<img src={"/blobs/ec2u.eu.png"} alt={"EC2U Locations"} style={{ width: "100%", maxWidth: "50em" }}/>}

		</DataPage>

	);
}
