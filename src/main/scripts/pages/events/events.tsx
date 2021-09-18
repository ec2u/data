/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { ReactNode, useState } from "react";
import { freeze } from "../../@metreeca/tool";
import { blank, probe, Query, string } from "../../@metreeca/tool/bases";
import { Updater } from "../../@metreeca/tool/hooks";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useKeywords } from "../../@metreeca/tool/hooks/keywords";
import { useQuery } from "../../@metreeca/tool/hooks/query";
import { Filter } from "../../@metreeca/tool/tiles/icon";
import { ToolSearch } from "../../@metreeca/tool/tiles/inputs/search";
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
		},

		startDate: ""

	}]

});


export function DataEvents() {

	const [query, setQuery]=useQuery<Query>({
		".order": "startDate",
		".limit": 20
	});

	const [pane, setPane]=useState<ReactNode>(facets([query, setQuery]));

	const [events]=useEntry("", Events, query);

	return (

		<DataPage item={string(Events.label)}

			menu={blank(events) && <ToolSpin/>}

			side={<button title={"Filters"} onClick={() => setPane(facets([query, setQuery]))}><Filter/></button>}

			pane={pane}

		>{probe(events, {

			frame: ({ contains }) => contains.map(({ id, label, image, comment, university, startDate }) =>

				<DataCard key={id}

					name={<>
						<a href={university.id}>{string(university.label).replace("University of ", "")}</a>
						<span>{startDate.substr(0, 10)}</span>
						<a href={id}>{string(label)}</a>
					</>}

					icon={image?.[0]}
					tags={{ Event: Events.id }}

				>

					{string(comment)}

				</DataCard>)

		})}</DataPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function facets([query, setQuery]: [query: Query, setQuery: Updater<Query>]) {

	const [keywords, setKeywords]=useKeywords("label", [query, setQuery]);

	return <ToolPane header={<ToolSearch icon rule placeholder={"Search"}
		auto={500} value={keywords} onChange={setKeywords}
	/>}>


		{/*<ToolField expanded name={"University"} selector={<ToolOptions value={useOptions(*/}
		{/*	"", "university", [query, setQuery]*/}
		{/*)}/>}/>*/}

	</ToolPane>;
}


