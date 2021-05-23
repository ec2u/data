/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useEntry } from "@metreeca/tile/nests/connector";
import { useRouter } from "@metreeca/tile/nests/router";
import { ToolSpin } from "@metreeca/tile/tiles/loaders/spin";
import { createElement } from "preact";
import { useEffect } from "preact/hooks";
import { ToolPage } from "../../tiles/page";
import "./university.css";


const University={

	id: "",
	label: "",
	comment: "",

	schac: "",
	lat: 0,
	long: 0,

	image: "",
	inception: "",

	country: {
		id: "",
		label: ""
	},

	location: {
		id: "",
		label: ""
	}

};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolUniversity() {

	const { name }=useRouter();

	const university=useEntry("", University);

	useEffect(() => university.then(university => { name(university.label); }));

	return university.then(university => (

		<ToolPage

			item={(
				<>
					<a href={"/universities/"}>Universities</a>
					<span>{university.label}</span>
				</>
			)}

			pane={side(university)}

		>

			{main(university)}

		</ToolPage>

	)) || <ToolSpin size="3em"/>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function side({ inception, country, location }: typeof University) {
	return <dl>

		<dt>Country</dt>
		<dd><a href={country.id}>{country.label}</a></dd>

		<dt>Location</dt>
		<dd><a href={location.id}>{location.label}</a></dd>

		<dt>Inception</dt>
		<dd>{inception && inception.substr(0, 4) || "-"}</dd>

	</dl>;
}

function main({ label, comment, image }: typeof University) {
	return createElement("tool-university", {}, <>

		{image && <img src={image} alt={`Image of ${label}`}/>}

		<p>{comment}</p>

	</>);
}
