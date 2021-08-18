/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Query } from "@metreeca/tile/graphs";
import { StateUpdater } from "@metreeca/tile/hooks";
import { useQuery } from "@metreeca/tile/hooks/query";
import { useEntry, useKeywords, useOptions } from "@metreeca/tile/nests/connector";
import { ToolInput } from "@metreeca/tile/tiles/controls/input";
import { ToolField } from "@metreeca/tile/tiles/fields/field";
import { ToolOptions } from "@metreeca/tile/tiles/fields/options";
import { Search } from "@metreeca/tile/tiles/icon";
import { ToolSpin } from "@metreeca/tile/tiles/loaders/spin";
import { ToolPane } from "@metreeca/tile/tiles/pane";
import * as React from "react";
import { createElement } from "react";
import { ToolCard } from "../../tiles/card";
import { ToolPage } from "../../tiles/page";


const Events={

	id: "",

	contains: [{

		id: "",
		label: { en: "" },
		comment: { en: "" },
		image: ""

	}]

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolEvents() {

	const [query, putQuery]=useQuery({
		".order": "startDate",
		".limit": 20
	});

	return (

		<ToolPage

			item={"Events"}

			pane={side([query, putQuery])}

		>

			{main(query)}

		</ToolPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side([query, setQuery]: [query: Query, setQuery: StateUpdater<Query>]) {
	return <ToolPane header={<ToolInput rule menu={<Search/>}
		placeholder="Search"
		value={useKeywords("label", [query, setQuery])}
	/>}>

		<ToolField expanded name={"University"} selector={<ToolOptions value={useOptions(
			"", "university", [query, setQuery]
		)}/>}/>

	</ToolPane>;
}

function main(query: Query) {

	const events=useEntry("", Events, query);

	return events.then(events => createElement("tool-events", {}, events.contains.map(event =>

		<ToolCard key={event.id}

			site={<a href={event.id}>{event.label?.en}</a>}
			icon={event.image?.[0]}
			tags={{ Event: "/events/" }}

		>{event.comment?.en}</ToolCard>
	))) || <ToolSpin/>;
}
