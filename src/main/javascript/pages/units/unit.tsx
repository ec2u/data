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
import { local, toLocalString } from "@metreeca/core/local";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolLabel } from "@metreeca/view/layouts/label";
import { ToolPanel } from "@metreeca/view/layouts/panel";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Unit=immutable({

	id: required("/units/{code}"),

	generated: optional(boolean),

	label: required(local),
	comment: optional(local),

	definition: optional(local),

	homepage: multiple(id),

	university: optional({
		id: required(id),
		label: required(local)
	}),

	hasHead: multiple({
		id: required(id),
		label: required(local)
	}),

	unitOf: repeatable({
		id: required(id),
		label: required(local)
	}),

	hasUnit: multiple({
		id: required(id),
		label: required(local)
	}),

	classification: multiple({
		id: required(id),
		label: required(local)
	}),

	subject: multiple({
		id: required(id),
		label: required(local)
	})

});


export function DataUnit() {

	const [unit]=useResource(Unit);

	return <DataPage name={[Units, ""]} info={<DataAI>{unit?.generated}</DataAI>}

		tray={<ToolFrame as={({

			homepage,

			university,
			classification,

			hasHead

		}) => <>

			<ToolInfo>{{

				"University": university && <ToolLink>{university}</ToolLink>,

				"Type": classification?.length && <ul>{classification.map(type =>
					<li key={type.id}><ToolLink>{type}</ToolLink></li>
				)}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"Head": hasHead?.length === 1 ? <span>{toEntryString(hasHead[0])}</span> : hasHead?.length &&
                    <ul>{[...hasHead]
						.sort(entryCompare)
						.map(head => <li key={head.id}>{toEntryString(head)}</li>)
					}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"Info": homepage?.length && <ul>{homepage.map(url =>
					<li key={url}><a href={url}>{toIdString(url, { compact: true })}</a></li>
				)}</ul>

			}}</ToolInfo>

		</>}>{unit}</ToolFrame>}
	>

		<ToolFrame placeholder={Events[icon]} as={({

			comment,
			label,

			definition,

			university,

			unitOf,
			hasUnit,
			subject

		}) => {

			const parent=unitOf.filter(unit => !university || unit.id !== university.id);
			const description=definition ?? comment;

			return <>

				<dfn>{toLocalString(label)}</dfn>

				{description && <ToolMark>{toLocalString(description)}</ToolMark>}

				{(parent.length || hasUnit || subject) && <ToolPanel>

					{parent.length > 0 && <ToolLabel name={"Parent Organizations"} wide>
                        <ul>{parent.slice()
							.sort(entryCompare)
							.map(parent =>
								<li key={parent.id}><ToolLink>{parent}</ToolLink>
								</li>
							)}</ul>
                    </ToolLabel>}

					{hasUnit && <ToolLabel name={"Organizational Units"} wide>
                        <ul>{hasUnit.slice()
							.sort(entryCompare)
							.map(unit =>
								<li key={unit.id}><ToolLink>{unit}</ToolLink></li>
							)}</ul>
                    </ToolLabel>}

					{subject && <ToolLabel name={"Topics"} wide>
                        <ul>{subject.slice().sort(entryCompare).map(subject =>
							<li key={subject.id}><ToolLink>{subject}</ToolLink></li>
						)}</ul>
                    </ToolLabel>}

                </ToolPanel>}

			</>;
		}}>{unit}</ToolFrame>

	</DataPage>;

}
