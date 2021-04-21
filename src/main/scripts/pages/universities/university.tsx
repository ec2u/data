/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useEntry } from "@metreeca/tile/hooks/entry";
import { title } from "@metreeca/tile/nests/router";
import { Custom } from "@metreeca/tile/tiles/custom";
import { ToolSpinner } from "@metreeca/tile/tiles/spinner";
import { useEffect } from "preact/hooks";
import ToolPage from "../../tiles/page";
import "./university.less";


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

export default function ToolUniversity() {

	const university=useEntry("", University);

	useEffect(() => university.then(university => title(university.label)));

	return university.then(university => (

		<ToolPage

			name={(
				<>
					<a href={"/universities/"}>Universities</a>
					<a href={university.id}>{university.label}</a>
				</>
			)}

			side={side(university)}

		>

			{main(university)}

		</ToolPage>

	)) || <ToolSpinner size="3em"/>;

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
	return <Custom tag="tool-university">

		{image && <img src={image} alt={`Image of ${label}`}/>}

		<p>{comment}</p>

	</Custom>;
}
