/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { useEffect, useReducer } from "react";
import { freeze, Query, string } from "../../@metreeca/tool/bases";
import { Updater } from "../../@metreeca/tool/hooks";
import { useEntry } from "../../@metreeca/tool/hooks/queries/entry";
import { useRange } from "../../@metreeca/tool/hooks/queries/range";
import { useSearch } from "../../@metreeca/tool/hooks/queries/search";
import { useTerms } from "../../@metreeca/tool/hooks/queries/terms";
import { useQuery } from "../../@metreeca/tool/hooks/query";
import { useRouter } from "../../@metreeca/tool/nests/router";
import { ToolTerms } from "../../@metreeca/tool/tiles/facets/terms";
import { ToolFacet } from "../../@metreeca/tool/tiles/inputs/facet";
import { ToolSearch } from "../../@metreeca/tool/tiles/inputs/search";
import { ClearIcon } from "../../@metreeca/tool/tiles/page";
import { ToolPane } from "../../@metreeca/tool/tiles/pane";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";
import { DataFiltersButton } from "../../panes/filters";
import { DataCard } from "../../tiles/card";
import { DataPage } from "../../tiles/page";
import { University } from "../universities/university";


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


	const [, update]=useReducer(v => v+1, 0);

	const [{ fetch, frame, error }]=useEntry("", Events, [query, setQuery]);


	useEffect(() => { name(string(Events.label)); });


	return <DataPage item={string(Events.label)}

		menu={fetch(abort => <ToolSpin abort={abort}/>)}

		side={<DataFiltersButton onClick={update}/>}

		pane={facets([query, setQuery])}

	>

		{frame(({ contains }) => contains.map(({ id, label, image, comment, university, startDate }) => (

			<DataCard key={id}

				name={<a href={id}>{string(label)}</a>}

				icon={image?.[0]}
				tags={<>
					<span>{string(university.label).replace("University of ", "")}</span>
					<span> / </span>
					<span>{startDate.substr(0, 10)}</span>
				</>}

			>

				{string(comment)}

			</DataCard>

		)))}

		{error(error => <span>{error.status}</span>)} {/* !!! */}

	</DataPage>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function facets([query, setQuery]: [query: Query, setQuery: Updater<Query>]) {

	const [search, setSearch]=useSearch("label", [query, setQuery]);

	const [universities, setUniversities]=useTerms("", "university", [query, setQuery]);

	const [{ count }]=useRange("", "label"); // !!! root path

	return <ToolPane

		header={<ToolSearch icon rule placeholder={"Search"}
			auto value={search} onChange={setSearch}
		/>}

		footer={count === 0 ? "no matches" : count === 1 ? "1 match" : `${count} matches`}

	>

		<ToolFacet expanded name={string(University.label)}
			menu={<button title={"Clear filter"} onClick={() => {}}><ClearIcon/></button>}
		>
			<ToolTerms value={[universities, setUniversities]}/>
		</ToolFacet>

		{/*<ToolFacet name={"Date"}
		 menu={<button title={"Clear filter"} onClick={() => {}}><ClearIcon/></button>}
		 >
		 <ToolRange pattern={"\\d{4}-\\d{2}-\\d{2}"} value={[{}, () => {}]}/>
		 </ToolFacet>*/}

	</ToolPane>;
}