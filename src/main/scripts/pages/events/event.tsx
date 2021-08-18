/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useEntry } from "@metreeca/tile/nests/connector";
import { useRouter } from "@metreeca/tile/nests/router";
import { ToolSpin } from "@metreeca/tile/tiles/loaders/spin";
import * as React from "react";
import { createElement, useEffect } from "react";
import { ToolPage } from "../../tiles/page";


const Event={

	id: "",
	label: { en: "" },
	comment: { en: "" },
	image: ""

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolEvent() {

	const { name }=useRouter();

	const event=useEntry("", Event);

	useEffect(() => event.then(event => { name(event.label?.en); }));

	return event.then(event => (

		<ToolPage

			item={<>
				<a href={"/events/"}>Events</a>
				<span>{event.label?.en}</span>
			</>}

			pane={side(event)}

		>

			{main(event)}

		</ToolPage>

	)) || <ToolSpin/>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side({}: typeof Event) {
	return <dl>


	</dl>;
}

function main({ label, comment, image }: typeof Event) {
	return createElement("tool-event", {}, <>

		{image && <img src={image} alt={`Image of ${label?.en}`}/>}

		<p>{comment?.en}</p>

	</>);
}
