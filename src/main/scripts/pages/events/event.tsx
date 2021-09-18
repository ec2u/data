/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { useEffect } from "react";
import { freeze } from "../../@metreeca/tool";
import { blank, frame, probe, string } from "../../@metreeca/tool/bases";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useRouter } from "../../@metreeca/tool/nests/router";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";
import { DataPage } from "../../tiles/page";


export const Event=freeze({

	id: "/events/{code}",

	image: "",
	label: { en: "Event" },
	comment: { en: "" }

});


export function DataEvent() {

	const { name }=useRouter();

	const [event]=useEntry("", Event);


	useEffect(() => { frame(event) && name(string(event.label)); });


	return <DataPage

		item={<>
			<a href={"/events/"}>Events</a>
			<span>{frame(event) && string(event.label)}</span>
		</>}

		menu={blank(event) && <ToolSpin/>}

	>{probe(event, {

		frame: ({ image, label, comment }) => <>

			{image && <img src={image} alt={`Image of ${string(label)}`}/>}

			<p>{string(comment)}</p>

		</>

	})}</DataPage>;

}
