/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Query } from "@metreeca/tile/graphs";
import { StateUpdater } from "@metreeca/tile/hooks";
import { useQuery } from "@metreeca/tile/hooks/query";
import { useEntry, useKeywords, useOptions } from "@metreeca/tile/nests/connector";
import { ToolInput } from "@metreeca/tile/tiles/controls/input";
import { ToolField } from "@metreeca/tile/tiles/fields/field";
import { ToolOptions } from "@metreeca/tile/tiles/fields/options";
import { MapPin, Search } from "@metreeca/tile/tiles/icon";
import * as React from "react";
import { createElement } from "react";
import { ToolPage } from "../tiles/page";
import "./home.css";


const Resources={

	id: "",

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolHome() {

	const [query, putQuery]=useQuery({ ".limit": 20 });

	return (

		<ToolPage

			item={<ToolInput rule menu={<Search/>}
				placeholder="Discover EC2U Skills and Resources"
				value={useKeywords("label", [query, putQuery])}
			/>}

			pane={side(query, putQuery)}

		>{

			Object.keys(query) ? main(query) : main(query)

		}</ToolPage>

	);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side(query: Query, setQuery: StateUpdater<Query>) {
	return <>

		<ToolField name={"University"} selector={<ToolOptions value={useOptions(
			"", "university", [query, setQuery]
		)}/>}/>

		<ToolField name={"Collection"} selector={<ToolOptions value={useOptions(
			"", "type", [query, setQuery]
		)}/>}/>

	</>;
}


function main(query: Query) {

	const resources=useEntry("", Resources, query);

	return createElement("tool-home", {}, <>

		<ul>
			<li><span>7</span><a href="/universities/"><MapPin/></a><span>Universities</span></li>
			<li><span>#</span><a href="/events/"><MapPin/></a><span>Events</span></li>
			{/*<li><span>123</span><a href="/structures/"><Bookmark/></a><span>Subjects</span></li>*/}
			{/*<li><span>2'300</span><a href="/structures/"><Tool/></a><span>Projects</span></li>*/}
			{/*<li><span>4'200</span><a href="/structures/"><Users/></a><span>People</span></li>*/}
			{/*<li><span>567'890</span><a href="/structures/"><BookOpen/></a><span>Publications</span></li>*/}
		</ul>

	</>);
}
