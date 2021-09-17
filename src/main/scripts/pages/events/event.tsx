/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { freeze } from "../../@metreeca/tool";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useRouter } from "../../@metreeca/tool/nests/router";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Event=freeze({

	id: "/events/{code}",

	label: { en: "Event" },
	comment: { en: "" },
	image: ""

});

export function ToolEvent() {

	const { name }=useRouter();

	const [event]=useEntry("", Event);

	/*useEffect(() => name(event.label?.en));

	 return event.then(event => (

	 <ToolPage

	 item={<>
	 <a href={"/events/"}>Events</a>
	 <span>{event.label?.en}</span>
	 </>}

	 >

	 {main(event)}

	 </ToolPage>

	 )) ||*/
	return <ToolSpin/>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// function main({ label, comment, image }: typeof Event) {
// 	return createElement("tool-event", {}, <>
//
// 		{image && <img src={image} alt={`Image of ${label?.en}`}/>}
//
// 		<p>{comment?.en}</p>
//
// 	</>);
// }
