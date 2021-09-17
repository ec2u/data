/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { freeze } from "../../@metreeca/tool";
import { blank, probe, Query, string } from "../../@metreeca/tool/bases";
import { Updater } from "../../@metreeca/tool/hooks";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useQuery } from "../../@metreeca/tool/hooks/query";
import { ToolPane } from "../../@metreeca/tool/tiles/pane";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";
import { DataCard } from "../../tiles/card";
import { DataPage } from "../../tiles/page";


export const Events=freeze({

	id: "/events/",

	label: { en: "Events" },

	contains: [{

		id: "",

		label: { en: "" },
		comment: { en: "" },
		image: "",

		university: {
			id: "",
			label: { en: "" }
		}

	}]

});


export function DataEvents() {

	const [query, putQuery]=useQuery<Query>({
		".order": "startDate",
		".limit": 20
	});


	const [events]=useEntry("", Events, query);

	return (

		<DataPage item={string(Events.label)}

			menu={blank(events) && <ToolSpin/>}
			pane={side([query, putQuery])}

		>{probe(events, {

			frame: ({ contains }) => contains.map(({ id, label, image, comment, university }) =>

				<DataCard key={id}

					site={<a href={university.id}>{string(university.label)}</a>}
					name={<a href={id}>{string(label)}</a>}
					icon={image?.[0]}
					tags={{ Event: Events.id }}

				>

					{string(comment)}

				</DataCard>)

		})}</DataPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side([query, setQuery]: [query: Query, setQuery: Updater<Query>]) {
	return <ToolPane /*header={<ToolInput rule menu={<Search/>}
	 placeholder="Search"
	 value={useKeywords("label", [query, setQuery])}
	 />}*/>

		{/*<ToolField expanded name={"University"} selector={<ToolOptions value={useOptions(*/}
		{/*	"", "university", [query, setQuery]*/}
		{/*)}/>}/>*/}

	</ToolPane>;
}


