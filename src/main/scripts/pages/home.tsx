/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useQuery } from "@metreeca/tile/hooks/query";
import { Custom } from "@metreeca/tile/tiles/custom";
import { Bookmark, BookOpen, Home, MapPin, Tool, Users } from "@metreeca/tile/tiles/icon";
import { ToolSearch } from "@metreeca/tile/tiles/search";
import ToolFacet from "../tiles/facet";
import ToolPage from "../tiles/page";
import "./home.css";


const Resources={

	contains: [{

		id: "",

		type: [""],

		label: "",
		image: "",
		comment: "",

		university: {
			id: "",
			label: ""
		}

	}]

};

const Query={

	"~label": "",

	"university": [],
	"type": [],

	".order": "",

	".offset": 0,
	".limit": 20

};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolHome() {

	const [query, putQuery]=useQuery(Query);

	return (

		<ToolPage

			name={<ToolSearch path="" placeholder="Discover Skills and Resources" state={[query, putQuery]}/>}
			side={facets(query, putQuery)}

		>

			<Custom tag="tool-home">

				<ul>
					<li><span>7</span><a href="/universities/"><MapPin/></a><span>Universities</span></li>
					<li><span>99</span><a href="/structures/"><Home/></a><span>Structures</span></li>
					<li><span>123</span><a href="/structures/"><Bookmark/></a><span>Subjects</span></li>
					<li><span>2'300</span><a href="/structures/"><Tool/></a><span>Projects</span></li>
					<li><span>4'200</span><a href="/structures/"><Users/></a><span>People</span></li>
					<li><span>567'890</span><a href="/structures/"><BookOpen/></a><span>Publications</span></li>
				</ul>

			</Custom>

		</ToolPage>

	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function facets(query: typeof Query, putQuery: (delta: Partial<typeof query>) => void) {

	return <>

		<ToolFacet name={"University"} path={"university"} query={[query, putQuery]}/>
		<ToolFacet name={"Collection"} path={"type"} query={[query, putQuery]}/>

	</>;
}