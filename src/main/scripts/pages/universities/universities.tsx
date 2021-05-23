/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Query } from "@metreeca/tile/graphs";
import { useQuery } from "@metreeca/tile/hooks/query";
import { useEntry, useKeywords } from "@metreeca/tile/nests/connector";
import { ToolInput } from "@metreeca/tile/tiles/controls/input";
import { Search } from "@metreeca/tile/tiles/icon";
import { ToolSpin } from "@metreeca/tile/tiles/loaders/spin";
import { createElement } from "preact";
import { ToolCard } from "../../tiles/card";
import { ToolPage } from "../../tiles/page";


const Universities={

	id: "",

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolUniversities() {

	const [query, putQuery]=useQuery({ ".limit": 20 });

	return (

		<ToolPage

			item={<ToolInput rule menu={<Search/>}
				placeholder="Universities"
				value={useKeywords("label", [query, putQuery])}
			/>}

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

function main(query: Query) {

	const universities=useEntry("", Universities, query);

	return universities.then(universities => createElement("tool-universities", {}, universities.contains.map(university =>

		<ToolCard

			site={<a href={university.id}>{university.label}</a>}
			icon={university.image}
			tags={[<a href={"/universities/"}>University</a>]}

		>{university.comment}</ToolCard>
	))) || <ToolSpin/>;
}
