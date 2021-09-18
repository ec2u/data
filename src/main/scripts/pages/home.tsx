/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { freeze } from "../@metreeca/tool";
import { string } from "../@metreeca/tool/bases";
import { Heart } from "../@metreeca/tool/tiles/icon";
import { DataPage } from "../tiles/page";
import { About } from "./about";

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

		<DataPage item={"Connect Centre"} menu={<a href={About.id} title={`About ${string(Home.label)}`}><Heart/></a>}>

			{<img src={"/blobs/ec2u.eu.png"} alt={"EC2U Locations"} style={{ width: "100%" }}/>}

		</DataPage>

	);
}
