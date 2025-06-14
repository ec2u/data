/*
 * Copyright © 2020-2025 EC2U Alliance
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


import { Events } from "@ec2u/data/pages/events/events";
import { Units } from "@ec2u/data/pages/units/units";
import { DataAI } from "@ec2u/data/views/ai";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, repeatable, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { entryCompare, toEntryString } from "@metreeca/core/entry";
import { id, toIdString } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { TileLabel } from "@metreeca/view/layouts/label";
import { TilePanel } from "@metreeca/view/layouts/panel";
import { TileFrame } from "@metreeca/view/lenses/frame";
import { TileInfo } from "@metreeca/view/widgets/info";
import { TileLink } from "@metreeca/view/widgets/link";
import { TileMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Unit=immutable({

	id: required("/units/{code}"),

	generated: optional(boolean),


	identifier: optional(string),

	prefLabel: required(text),
	altLabel: optional(text),
	definition: optional(text),

	homepage: multiple(id),

	university: optional({
		id: required(id),
		label: required(text)
	}),

	hasHead: multiple({
		id: required(id),
		label: required(text)
	}),

	unitOf: repeatable({
		id: required(id),
		label: required(text)
	}),

	hasUnit: multiple({
		id: required(id),
		label: required(text)
	}),

	classification: multiple({
		id: required(id),
		label: required(text)
	}),

	subject: multiple({
		id: required(id),
		label: required(text),
		broaderTransitive: multiple({
			id: required(id)
		})
	})

});


export function DataUnit() {

	const [unit]=useResource(Unit);

	return <DataPage name={[Units, ""]} info={<DataAI>{unit?.generated}</DataAI>}

		tray={<TileFrame as={({

			identifier,

			altLabel,

			homepage,

			university,
			classification,

			hasHead

		}) => <>

			{(altLabel?.[""] || identifier) && <TileInfo>{{

				"Short": altLabel?.[""],
				"Code": identifier

			}}</TileInfo>}

			<TileInfo>{{

				"University": university && <TileLink>{university}</TileLink>,

				"Type": classification?.length === 1 && <TileLink>{classification[0]}</TileLink>
					|| classification?.length && <ul>{classification.map(type =>
						<li key={type.id}><TileLink>{type}</TileLink></li>
					)}</ul>

			}}</TileInfo>

			<TileInfo>{{

				"Head": hasHead?.length === 1 ? <span>{toEntryString(hasHead[0])}</span> : hasHead?.length &&
                    <ul>{[...hasHead]
						.sort(entryCompare)
						.map(head => <li key={head.id}>{toEntryString(head)}</li>)
					}</ul>

			}}</TileInfo>

			<TileInfo>{{

				"Info": homepage?.length === 1 && <a href={homepage[0]}>{toIdString(homepage[0], { compact: true })}</a>
					|| homepage?.length && <ul>{homepage.map(url =>
						<li key={url}><a href={url}>{toIdString(url, { compact: true })}</a></li>
					)}</ul>

			}}</TileInfo>

		</>}>{unit}</TileFrame>}
	>

		<TileFrame placeholder={Events[icon]} as={({

			prefLabel,
			altLabel,
			definition,

			university,

			unitOf,
			hasUnit,
			subject

		}) => {

			const parent=unitOf.filter(unit => !university || unit.id !== university.id);
			const description=definition;

			return <>

				<dfn>{toTextString(prefLabel)}</dfn>

				{description && <TileMark>{toTextString(description)}</TileMark>}

				{(subject?.length || parent.length || hasUnit?.length) && <TilePanel stack>

					{subject && subject.length > 0 && <TileLabel name={"Topics"} wide>
                        <ul>{subject.slice()
							.sort((x, y) => {

								const xdepth=x.broaderTransitive?.length || 0;
								const ydepth=y.broaderTransitive?.length || 0;

								return xdepth !== ydepth ? xdepth - ydepth : entryCompare(x, y);

							})
							.map(subject =>
								<li key={subject.id}><TileLink>{subject}</TileLink></li>
							)}</ul>
                    </TileLabel>}

					{parent.length > 0 && <TileLabel name={"Parent Organizations"} wide>
                        <ul>{parent.slice()
							.sort(entryCompare)
							.map(parent =>
								<li key={parent.id}><TileLink>{parent}</TileLink></li>
							)}</ul>
                    </TileLabel>}

					{hasUnit && hasUnit.length > 0 && <TileLabel name={"Organizational Units"} wide>
                        <ul>{hasUnit.slice()
							.sort(entryCompare)
							.map(unit =>
								<li key={unit.id}><TileLink>{unit}</TileLink></li>
							)}</ul>
                    </TileLabel>}

                </TilePanel>}

			</>;

		}}>{unit}</TileFrame>

	</DataPage>;

}
