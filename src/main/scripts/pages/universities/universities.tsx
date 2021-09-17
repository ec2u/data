/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { freeze } from "../../@metreeca/tool";
import { Query } from "../../@metreeca/tool/bases";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useQuery } from "../../@metreeca/tool/hooks/query";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";
import { DataPage } from "../../tiles/page";


export const Universities=freeze({

	id: "/universities/",

	label: { en: "Universities" },

	contains: [{

		id: "",

		label: { en: "" },
		comment: { en: "" },
		image: "",

		schac: "",
		lat: 0,
		long: 0

	}]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolUniversities() {

	const [query, putQuery]=useQuery({ ".limit": 20 });

	return (

		<DataPage

			// item={<ToolInput rule menu={<Search/>}
			// 	placeholder="Universities"
			// 	value={useKeywords("label", [query, putQuery])}
			// />}

		>

			{main(query)}

		</DataPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function main(query: Query) {

	const universities=useEntry("", Universities, query);

	return <ToolSpin/> /*universities.then(universities => createElement("tool-universities", {}, universities.contains.map(university =>

	 <ToolCard key={university.id}

	 site={<a href={university.id}>{university.label.en}</a>}
	 icon={university.image}
	 tags={{ University: "/universities/" }}

	 >{university.comment.en}</ToolCard>
	 ))) ||*/;
}
