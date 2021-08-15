/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useEntry } from "@metreeca/tile/nests/connector";
import { useRouter } from "@metreeca/tile/nests/router";
import { ToolSpin } from "@metreeca/tile/tiles/loaders/spin";
import * as React from "react";
import { createElement, useEffect } from "react";
import { ToolPage } from "../../tiles/page";
import "./university.css";


const University={

	id: "",
	label: { en: "" },
	comment: { en: "" },

	schac: "",
	lat: 0,
	long: 0,

	image: "",
	inception: "",

	country: {
		id: "",
		label: { en: "" }
	},

	location: {
		id: "",
		label: { en: "" }
	}

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolUniversity() {

	const { name }=useRouter();

	const university=useEntry("", University);

	useEffect(() => university.then(university => { name(university.label.en); }));

	return university.then(university => (

		<ToolPage

			item={<>
				<a href={"/universities/"}>Universities</a>
				<span>{university.label.en}</span>
			</>}

			pane={side(university)}

		>

			{main(university)}

		</ToolPage>

	)) || <ToolSpin/>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side({ inception, country, location }: typeof University) {
	return <dl>

		<dt>Country</dt>
		<dd><a href={country.id}>{country.label.en}</a></dd>

		<dt>Location</dt>
		<dd><a href={location.id}>{location.label.en}</a></dd>

		<dt>Inception</dt>
		<dd>{inception && inception.substr(0, 4) || "-"}</dd>

	</dl>;
}

function main({ label, comment, image }: typeof University) {
	return createElement("tool-university", {}, <>

		{image && <img src={image} alt={`Image of ${label.en}`}/>}

		<p>{comment.en}</p>

	</>);
}
