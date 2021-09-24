/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { freeze, string } from "@metreeca/tool/bases";
import { useEntry } from "@metreeca/tool/hooks/queries/entry";
import { useRouter } from "@metreeca/tool/nests/router";
import { ToolSpin } from "@metreeca/tool/tiles/spin";
import * as React from "react";
import { useEffect } from "react";
import { DataCard } from "../../tiles/card";
import { DataPage } from "../../tiles/page";


export const Event=freeze({

	id: "/events/{code}",

	image: "",
	label: { en: "Event" },
	comment: { en: "" },

	startDate: ""

});


export function DataEvent() {

	const { name }=useRouter();

	const [{ fetch, frame, error }]=useEntry("", Event);


	useEffect(() => { frame(({ label }) => name(string(label))); });


	return <DataPage

		item={<>
			<a href={"/events/"}>Events</a>
			<span>{frame(({ label }) => string(label))}</span>
		</>}

		menu={fetch(abort => <ToolSpin abort={abort}/>)}

	>

		{frame(({

			image, label, comment,

			startDate

		}) => (

			<DataCard

				icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}

				info={<dl>

					<dt>Start Date</dt>
					<dd>{startDate}</dd>

				</dl>}

			>

				<p>{string(comment)}</p>

			</DataCard>

		))}

		{error(error => <span>{error.status}</span>)} {/* !!! */}

	</DataPage>;

}
