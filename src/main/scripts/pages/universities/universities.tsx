/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useEntry } from "@metreeca/tile/hooks/entry";
import { useQuery } from "@metreeca/tile/hooks/query";
import { ToolSearch } from "@metreeca/tile/tiles/search";
import { ToolSpin } from "@metreeca/tile/tiles/spin";
import { createElement } from "preact";
import { ToolCard } from "../../tiles/card";
import { ToolPage } from "../../tiles/page";


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

export function ToolUniversities() {

	const [query, putQuery]=useQuery(Query);

	return (

		<ToolPage

			item={<ToolSearch path={"label"} placeholder="Discover Universities" state={[query, putQuery]}/>}
			pane={side()}

		>

			{main(query)}

		</ToolPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side() {
	return <a href={"https://tinyurl.com/ygm9chxw"}>
		{/*<img src={"/blobs/ec2u.eu.png"} alt={"EC2U Locations"}/>*/}
	</a>;
}

function main(query: typeof Query) {

	const universities=useEntry("", Universities, query);

	return createElement("tool-universities", {}, <>

		{universities.then(universities => universities.contains.map(university =>

			<ToolCard

				site={<a href={university.id}>{university.label}</a>}
				icon={university.image}
				tags={[<a href={"/universities/"}>University</a>]}

			>{university.comment}</ToolCard>
		)) || <ToolSpin size="3em"/>}

	</>);
}
