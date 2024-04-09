/*
 * Copyright © 2020-2024 EC2U Alliance
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
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, repeatable, required } from "@metreeca/core";
import { toEntryString } from "@metreeca/core/entry";
import { id, toIdString } from "@metreeca/core/id";
import { Local, local, toLocalString } from "@metreeca/core/local";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Unit=immutable({

	id: required("/units/{code}"),

	comment: optional(local),

	prefLabel: required(local),
	altLabel: optional(local),

	homepage: multiple(id),

	partner: optional({
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


export function toUnitLabel({ altLabel, prefLabel }: { prefLabel: Local, altLabel?: Local }) {
	return altLabel
		? `${toLocalString(altLabel)} - ${toLocalString(prefLabel)}`
		: toLocalString(prefLabel);
}


export function DataUnit() {

	const [unit]=useResource(Unit);


	return <DataPage

		name={[Units, unit && toUnitLabel(unit)]}

		tray={<ToolFrame as={({

			prefLabel,
			altLabel,

			homepage,

			partner,
			classification,

			hasHead,

			subject

		}) => <>

			<ToolInfo>{{

				"Owner": partner && <ToolLink>{partner}</ToolLink>,

				"Type": classification?.length && <ul>{classification.map(type =>
					<li key={type.id}><ToolLink>{type}</ToolLink></li>
				)}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"Acronym": altLabel && <span>{toLocalString(altLabel)}</span>,
				"Name": <span>{toLocalString(prefLabel)}</span>,

				"Head": hasHead?.length === 1 ? <span>{toEntryString(hasHead[0])}</span> : hasHead?.length &&
                    <ul>{[...hasHead]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(head => <li key={head.id}>{toEntryString(head)}</li>)
				}</ul>,

				"Topics": subject && subject.length && <ul>{[...subject]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(subject => <li key={subject.id}>
						<ToolLink filter={[Units, { partner, subject }]}>{subject}</ToolLink>
					</li>)
				}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"Info": homepage && homepage.length && homepage.map(url =>
					<a key={url} href={url}>{toIdString(url, { compact: true })}</a>
				)

			}}</ToolInfo>

		</>}>{unit}</ToolFrame>}
	>

		<ToolFrame placeholder={Events[icon]} as={({

			comment,

			partner,
			unitOf,
			hasUnit

		}) => {

			const parents=unitOf.filter(unit => !partner || unit.id !== partner.id);

			return <>

				{comment && <ToolMark>{toLocalString(comment)}</ToolMark>}

				{(parents?.length || hasUnit?.length) && <>

                    <hr/>

                    <dl>

						{parents?.length > 0 && <>

                            <dt>Parent Organizations</dt>

                            <dt>
                                <ul>{parents
									.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
									.map(parent => <li key={parent.id}><ToolLink>{parent}</ToolLink></li>)
								}</ul>
                            </dt>

                        </>}

						{hasUnit && <>

                            <dt>Organizational Units</dt>

                            <dt>
                                <ul>{hasUnit
									.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
									.map(unit => <li key={unit.id}><ToolLink>{unit}</ToolLink></li>)
								}</ul>
                            </dt>

                        </>}

                    </dl>

                </>}

			</>;
		}}>{unit}</ToolFrame>

	</DataPage>;

}
