/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { ReactNode } from "react";
import { blank, frame, string } from "../@metreeca/tool/bases";
import { Updater } from "../@metreeca/tool/hooks";
import { useEntry } from "../@metreeca/tool/hooks/entry";
import { Calendar, Database, Library, MapPin } from "../@metreeca/tool/tiles/icon";
import { ToolSearch } from "../@metreeca/tool/tiles/inputs/search";
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

export function DataResourcesButton({

	onClick

}: {

	onClick: Updater<ReactNode>

}) {

	return <button title={"Resources"}
		onClick={e => onClick(e.altKey ? <DataHiddenPane/> : <DataResourcesPane/>)}
	><Library/></button>;

}

export function DataResourcesPane() {

	const [resources]=useEntry("/", Resources);

	return <ToolPane header={<ToolSearch icon rule placeholder={"Search"}
		value={""} onChange={() => {}}
	/>}>

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

export function DataHiddenPane() {
	return <ToolPane>
		<ToolItem icon={<Database/>} name={<a href="/sparql" target={"_blank"}>SPARQL</a>}/>
	</ToolPane>;
}
