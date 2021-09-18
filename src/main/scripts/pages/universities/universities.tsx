/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { ReactNode, useEffect } from "react";
import { freeze } from "../../@metreeca/tool";
import { blank, probe, string } from "../../@metreeca/tool/bases";
import { useEntry } from "../../@metreeca/tool/hooks/entry";
import { useRouter } from "../../@metreeca/tool/nests/router";
import { ToolSpin } from "../../@metreeca/tool/tiles/spin";
import { DataCard } from "../../tiles/card";
import { DataPage } from "../../tiles/page";


export const Universities=freeze({

	id: "/universities/",

	label: { en: "Universities" },

	contains: [{

		id: "",

		image: "",
		label: { en: "" },
		comment: { en: "" },

		country: {
			id: "",
			label: { en: "" }
		}

	}]

});


export function DataUniversities() {

	const { name }=useRouter();

	const [universities]=useEntry("", Universities);


	useEffect(() => { name(string(Universities.label)); });


	return <DataPage item={string(Universities.label)}

		menu={blank(universities) && <ToolSpin/>}

	>{probe(universities, {

		frame: ({ contains }) => contains.map(({ id, label, image, comment, country }) => (

			<DataCard key={id}

				name={<a href={id}>{string(label)}</a>}
				icon={image}
				tags={<span>{string(country)}</span>}

			>
				{string(comment)}

			</DataCard>

		)) as ReactNode,

		error: error => <span>{error.status}</span>

	})}</DataPage>;

}
