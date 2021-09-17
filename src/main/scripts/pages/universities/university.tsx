/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { freeze } from "../../@metreeca/tool";
import { useRouter } from "../../@metreeca/tool/nests/router";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";


export const University=freeze({

	id: "/universities/{code}",

	label: { en: "University" },
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

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolUniversity() {

	const { name }=useRouter();

	// const university=useEntry("", University);

	// useEffect(() => university.then(university => { name(university.label.en); }));

	return <ToolSpin/> /*university.then(university => (

	 <ToolPage

	 item={<>
	 <a href={"/universities/"}>Universities</a>
	 <span>{university.label.en}</span>
	 </>}

	 pane={side(university)}

	 >

	 {main(university)}

	 </ToolPage>

	 )) ||*/;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
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
 */

/*
 function main({ label, comment, image }: typeof University) {
 return createElement("tool-university", {}, <>

 {image && <img src={image} alt={`Image of ${label.en}`}/>}

 <p>{comment.en}</p>

 </>);
 }
 */
