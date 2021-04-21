/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useEntry } from "@metreeca/tile/hooks/entry";
import { useQuery } from "@metreeca/tile/hooks/query";
import { Custom } from "@metreeca/tile/tiles/custom";
import { ToolSearch } from "@metreeca/tile/tiles/search";
import { ToolSpinner } from "@metreeca/tile/tiles/spinner";
import ToolCard from "../../tiles/card";
import ToolPage from "../../tiles/page";


const Universities={

	contains: [{

		id: "",
		label: "",
		comment: "",

		schac: "",
		lat: 0,
		long: 0

	}]

};

const Query={

	"~label": "",

	".order": "label",
	".offset": 0,
	".limit": 20

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolUniversities() {

	const [query, putQuery]=useQuery(Query);

	return (

		<ToolPage

			name={<ToolSearch path={"label"} placeholder="Discover Universities" state={[query, putQuery]}/>}
			side={<a href={"https://tinyurl.com/ygm9chxw"}>Locations ››</a>}

		>

			{cards(query)}

		</ToolPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function cards(query: typeof Query) {

	const universities=useEntry("", Universities, query);

	return <Custom tag={"tool-universities"}>

		{universities.then(universities => universities.contains.map(university =>

			<ToolCard

				site={<a href={university.id}>{university.label}</a>}
				tags={[<a href={"/universities/"}>University</a>]}

			>{university.comment}</ToolCard>
		)) || <caption><ToolSpinner size="3em"/></caption>}

	</Custom>;
}
