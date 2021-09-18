/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { ReactNode, useEffect, useState } from "react";
import { freeze } from "../../@metreeca/tool";
import { blank, probe, Query, string } from "../../@metreeca/tool/bases";
import { Updater } from "../../@metreeca/tool/hooks";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useKeywords } from "../../@metreeca/tool/hooks/keywords";
import { useQuery } from "../../@metreeca/tool/hooks/query";
import { useRouter } from "../../@metreeca/tool/nests/router";
import { ToolSearch } from "../../@metreeca/tool/tiles/inputs/search";
import { ToolPane } from "../../@metreeca/tool/tiles/pane";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";
import { DataFiltersButton } from "../../panes/filters";
import { DataCard } from "../../tiles/card";
import { DataPage } from "../../tiles/page";


export const Events=freeze({

	id: "/events/",

	label: { en: "Events" },

	contains: [{

		id: "",

		image: "",
		label: { en: "" },
		comment: { en: "" },

		university: {
			id: "",
			label: { en: "" }
		},

		startDate: "",
		endDate: ""

	}]

});


export function DataEvents() {

	const { name }=useRouter();

	const [query, setQuery]=useQuery<Query>({

		"~label": "",

		".order": "startDate",
		".limit": 20

	});


	const [events]=useEntry("", Events, query);

	const [pane, setPane]=useState<ReactNode>(facets([query, setQuery]));


	useEffect(() => { name(string(Events.label)); });


	return <DataPage item={string(Events.label)}

		menu={blank(events) && <ToolSpin/>}

		side={<DataFiltersButton onClick={() => setPane(facets([query, setQuery]))}/>}

		pane={pane}

	>{probe(events, {

		frame: ({ contains }) => contains.map(({ id, label, image, comment, university, startDate }) => (

			<DataCard key={id}

				name={<>
					<span>{string(university.label).replace("University of ", "")}</span>
					<span>{startDate.substr(0, 10)}</span>
					<a href={id}>{string(label)}</a>
				</>}

				icon={image?.[0]}
				tags={{ Event: Events.id }}

			>

				{string(comment)}

			</DataCard>

		)) as ReactNode,

		error: error => <span>{error.status}</span>

	})}</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function facets([query, setQuery]: [query: Query, setQuery: Updater<Query>]) {

	const [keywords, setKeywords]=useKeywords("label", [query, setQuery]);

	// const [items, setItems]=useItems("", "university", [query, setQuery]);

	return <ToolPane header={<ToolSearch icon rule placeholder={"Search"}
		auto={500} value={keywords} onChange={setKeywords}
	/>}>

		{/*<ToolItems value={[items, setItems]}/>*/}

	</ToolPane>;
}


