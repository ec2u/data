/*
 * Copyright © 2020-2022 EC2U Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { freeze, string } from "@metreeca/tool/bases";
import { useEntry } from "@metreeca/tool/hooks/queries/entry";
import { useRouter } from "@metreeca/tool/nests/router";
import { ToolSpin } from "@metreeca/tool/tiles/spin";
import * as React from "react";
import { useEffect } from "react";
import { DataCard } from "../../tiles/card";
import { DataPage } from "../../tiles/page";
import { Universities } from "./universities";


function optional<T>(value: T): undefined | typeof value {
	return value;
}

export const University=freeze({

	id: "/universities/{code}",

	image: "",
	label: { en: "University" },
	comment: { en: "" },

	schac: "",
	lat: 0,
	long: 0,

	inception: optional(""),
	students: optional(0),

	country: optional({
		id: "",
		label: { en: "" }
	}),

	location: optional({
		id: "",
		label: { en: "" }
	})

});


export function DataUniversity() {

	const { name }=useRouter();

	const [{ fetch, frame, error }]=useEntry("", University);


	useEffect(() => { frame(({ label }) => name(string(label))); });


	return <DataPage

		item={<>
			<a href={Universities.id}>{string(Universities.label)}</a>
			{frame(({ label }) => <span>{string(label)}</span>)}
		</>}

		menu={fetch(abort => <ToolSpin abort={abort}/>)}

	>

		{frame(({

				image, label, comment,
				inception, students,
				country, location

			}) => (

				<DataCard

					icon={image && <img src={image} alt={`Image of ${string(label)}`}/>}

					info={<dl>

						<dt>Inception</dt>
						<dd>{inception && inception.substr(0, 4) || "-"}</dd>

						<dt>Country</dt>
						<dd>{country && <a href={country.id}>{string(country.label)}</a>}</dd>

						<dt>City</dt>
						<dd>{location && <a href={location.id}>{string(location.label)}</a>}</dd>

						{students && <>
							<dt>Students</dt>
							<dd>{string(students)}</dd>
						</>}

					</dl>}

				>

					<p>{string(comment)}</p>

				</DataCard>

			)
		)}

		{error(error => <span>{error.status}</span>)} {/* !!! */}

	</DataPage>;
}