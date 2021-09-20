/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { useEffect } from "react";
import { freeze, string } from "../../@metreeca/tool/bases";
import { useEntry } from "../../@metreeca/tool/hooks/queries/entry";
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

	const [{ fetch, frame, error }]=useEntry("", Universities);


	useEffect(() => { name(string(Universities.label)); });


	return <DataPage item={string(Universities.label)}

		menu={fetch(abort => <ToolSpin abort={abort}/>)}

	>

		{frame(({ contains }) => contains.map(({ id, label, image, comment, country }) => (

			<DataCard key={id}

				name={<a href={id}>{string(label)}</a>}
				icon={image}
				tags={<span>{string(country)}</span>}

			>
				{string(comment)}

			</DataCard>

		)))}

		{error(error => <span>{error.status}</span>)} {/* !!! */}

	</DataPage>;

}
