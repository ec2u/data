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
import { local, toLocalString } from "@metreeca/core/local";
import { reference, toReferenceString } from "@metreeca/core/reference";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React from "react";

export const Unit=immutable({

	id: required("/units/{code}"),

	label: required(local),
	comment: optional(local),

	prefLabel: required(local),
	altLabel: optional(local),

	homepage: multiple(reference),

	university: optional({
		id: required(reference),
		label: required(local)
	}),

	classification: optional({
		id: required(reference),
		label: required(local)
	}),

	head: multiple({
		id: required(reference),
		label: required(local)
	}),

	organization: repeatable({
		id: required(reference),
		label: required(local)
	}),

	units: multiple({
		id: required(reference),
		label: required(local)
	}),

	subject: multiple({
		id: required(reference),
		label: required(local)
	})

});


export function DataUnit() {

	const [unit]=useResource({ ...Unit, id: "" });


	return <DataPage

		name={[Units, unit && (unit.altLabel
				? `${toLocalString(unit.altLabel)} - ${toLocalString(unit.prefLabel)}`
				: toLocalString(unit.prefLabel)
		)]}

		tray={<ToolFrame as={({

			prefLabel,
			altLabel,

			homepage,

			university,
			classification,

			head,

			subject

		}) => <>

			<ToolInfo>{{

				"University": university && <ToolLink>{university}</ToolLink>,

				"Type": classification && <ToolLink>{classification}</ToolLink>

			}}</ToolInfo>

			<ToolInfo>{{

				"Acronym": altLabel && <span>{toLocalString(altLabel)}</span>,
				"Name": <span>{toLocalString(prefLabel)}</span>,

				"Head": head?.length === 1 ? <span>{toEntryString(head[0])}</span> : head?.length && <ul>{[...head]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(head => <li key={head.id}>{toEntryString(head)}</li>)
				}</ul>,

				"Topics": subject && subject.length && <ul>{[...subject]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(subject => <li key={subject.id}>
						<ToolLink filter={[Units, { university, subject }]}>{subject}</ToolLink>
					</li>)
				}</ul>

			}}</ToolInfo>

			<ToolInfo>{{

				"Info": homepage && homepage.length && homepage.map(url =>
					<a key={url} href={url}>{toReferenceString(url, { compact: true })}</a>
				)

			}}</ToolInfo>

		</>}>{unit}</ToolFrame>}
	>

		<ToolFrame placeholder={Events[icon]} as={({

			comment,

			university,
			organization,
			units

		}) => {

			const parents=organization.filter(unit => !university || unit.id !== university.id);

			return <>

				{comment && <ToolMark>{toLocalString(comment)}</ToolMark>}

				{(parents.length || units?.length) && <>

                    <hr/>

                    <dl>

						{parents && <>

                            <dt>Parent Organizations</dt>

                            <dt>
                                <ul>{parents
									.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
									.map(parent => <li key={parent.id}><ToolLink>{parent}</ToolLink></li>)
								}</ul>
                            </dt>

                        </>}

						{units && <>

                            <dt>Organizational Units</dt>

                            <dt>
                                <ul>{units
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
