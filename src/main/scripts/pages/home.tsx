/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useEntry } from "@metreeca/tile/hooks/entry";
import { useQuery } from "@metreeca/tile/hooks/query";
import { MapPin } from "@metreeca/tile/tiles/icon";
import { ToolOptions } from "@metreeca/tile/tiles/options";
import { ToolSearch } from "@metreeca/tile/tiles/search";
import { createElement } from "preact";
import { ToolPage } from "../tiles/page";
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

			item={<ToolSearch path="label" placeholder="Discover Skills and Resources" state={[query, putQuery]}/>}
			pane={side(query, putQuery)}

		>{

			Object.keys(query) ? main(query) : main(query)

		}</ToolPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side(query: typeof Query, putQuery: (delta: Partial<typeof query>) => void) {
	return <>

		<ToolOptions label="University" path="university" state={[query, putQuery]}/>
		<ToolOptions label="Collection" path="type" state={[query, putQuery]}/>

	</>;
}


function main(query: typeof Query) {

	const resources=useEntry("", Resources, query);

	return createElement("tool-home", {}, <>

		<ul>
			<li><span>7</span><a href="/universities/"><MapPin/></a><span>Universities</span></li>
			{/*<li><span>99</span><a href="/structures/"><Home/></a><span>Structures</span></li>*/}
			{/*<li><span>123</span><a href="/structures/"><Bookmark/></a><span>Subjects</span></li>*/}
			{/*<li><span>2'300</span><a href="/structures/"><Tool/></a><span>Projects</span></li>*/}
			{/*<li><span>4'200</span><a href="/structures/"><Users/></a><span>People</span></li>*/}
			{/*<li><span>567'890</span><a href="/structures/"><BookOpen/></a><span>Publications</span></li>*/}
		</ul>

	</>);
}
