/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { blank, frame, string } from "../@metreeca/tool/bases";
import { useEntry } from "../@metreeca/tool/hooks/entry";
import { Calendar, MapPin } from "../@metreeca/tool/tiles/icon";
import { ToolItem } from "../@metreeca/tool/tiles/item";
import { ToolPane } from "../@metreeca/tool/tiles/pane";
import { ToolSpin } from "../@metreeca/tool/tiles/spin";
import { Events } from "../pages/events/events";
import { Universities } from "../pages/universities/universities";

const Resources={

	id: "/",

	universities: 0,
	events: 0

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolResources() {

	const [resources]=useEntry("/", Resources);

	return <ToolPane header={<input type={"search"} placeholder={"Search Resources"}
		value={""} onChange={() => {}}/>
	}>

		<ToolItem icon={<MapPin/>}
			name={<a href={Universities.id}>{string(Universities.label)}</a>}
			menu={blank(resources) ? <ToolSpin/> : frame(resources) ? resources.universities : "?"}
		/>

		<ToolItem icon={<Calendar/>}
			name={<a href={Events.id}>{string(Events.label)}</a>}
			menu={blank(resources) ? <ToolSpin/> : frame(resources) ? resources.events : "?"}
		/>

	</ToolPane>;
}