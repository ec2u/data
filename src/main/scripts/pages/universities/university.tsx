/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { useEffect } from "react";
import { freeze } from "../../@metreeca/tool";
import { blank, frame, probe, string } from "../../@metreeca/tool/bases";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useRouter } from "../../@metreeca/tool/nests/router";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";
import { DataPage } from "../../tiles/page";
import { Universities } from "./universities";


export const University=freeze({

	id: "/universities/{code}",

	image: "",
	label: { en: "University" },
	comment: { en: "" },

	schac: "",
	lat: 0,
	long: 0,

	inception: "",

	country: {
		id: "",
		label: { en: "" }
	},

	location: {
		id: "",
		label: { en: "" }
	}

});


export function DataUniversity() {

	const { name }=useRouter();

	const [university]=useEntry("", University);


	useEffect(() => { frame(university) && name(string(university.label)); });


	return <DataPage

		item={<>
			<a href={Universities.id}>{string(Universities.label)}</a>
			<span>{frame(university) && string(university.label)}</span>
		</>}

		menu={blank(university) && <ToolSpin/>}

	>{probe(university, {

		frame: ({

			image, label, comment,
			inception, country, location

		}) => <>

			{image && <img src={image} alt={`Image of ${string(label)}`}/>}

			<p>{string(comment)}</p>

			<dl>

				<dt>Inception</dt>
				<dd>{inception && inception.substr(0, 4) || "-"}</dd>

				<dt>Country</dt>
				<dd><a href={country.id}>{string(country.label)}</a></dd>

				<dt>Location</dt>
				<dd><a href={location.id}>{string(location.label)}</a></dd>

			</dl>

		</>

	})}</DataPage>;
}