/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { freeze } from "../../@metreeca/tool";
import { useQuery } from "../../@metreeca/tool/hooks/query";
import { DataPage } from "../../tiles/page";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Events=freeze({

	id: "/events/",

	label: { en: "Events" },

	contains: [{

		id: "",

		label: { en: "" },
		comment: { en: "" },
		image: ""

	}]

});


export function ToolEvents() {

	const [query, putQuery]=useQuery({
		".order": "startDate",
		".limit": 20
	});

	return (

		<DataPage item={<input type={"search"} placeholder={"Discover EC2U Events"}
			value={""} onChange={() => {}}/>
		}

			// pane={side([query, putQuery])}

		>

			{/*{main(query)}*/}

		</DataPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
 function side([query, setQuery]: [query: Query, setQuery: Updater<Query>]) {
 return <ToolPane header={<ToolInput rule menu={<Search/>}
 placeholder="Search"
 value={useKeywords("label", [query, setQuery])}
 />}>

 {/!*<ToolField expanded name={"University"} selector={<ToolOptions value={useOptions(*!/}
 {/!*	"", "university", [query, setQuery]*!/}
 {/!*)}/>}/>*!/}

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
 */
