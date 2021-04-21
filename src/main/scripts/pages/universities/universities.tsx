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
		image: "",

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
			side={side()}

		>

			{main(query)}

		</ToolPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side() {
	return <a href={"https://tinyurl.com/ygm9chxw"}>
		<img src={"/blobs/ec2u.png"} alt={"EC2U Locations"}/>
	</a>;
}

function main(query: typeof Query) {

	const universities=useEntry("", Universities, query);

	return <Custom tag={"tool-universities"}>

		{universities.then(universities => universities.contains.map(university =>

			<ToolCard

				site={<a href={university.id}>{university.label}</a>}
				icon={university.image}
				tags={[<a href={"/universities/"}>University</a>]}

			>{university.comment}</ToolCard>
		)) || <caption><ToolSpinner size="3em"/></caption>}

	</Custom>;
}
