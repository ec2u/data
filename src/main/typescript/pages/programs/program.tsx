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


import { Programs } from "@ec2u/data/pages/programs/programs";
import { DataAI } from "@ec2u/data/views/ai";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { decimal } from "@metreeca/core/decimal";
import { entryCompare } from "@metreeca/core/entry";
import { toFrameString } from "@metreeca/core/frame";
import { id, toIdString } from "@metreeca/core/id";
import { period, toPeriodString } from "@metreeca/core/period";
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
import React, { Fragment } from "react";

export const Program=immutable({

	id: required("/programs/{code}"),

	generated: optional(boolean),

	name: required(text),
	description: optional(text),

	identifier: optional(string),
	url: multiple(id),

	numberOfCredits: optional(decimal),
	timeToComplete: optional(period),

	teaches: optional(text),
	programPrerequisites: optional(text),
	assesses: optional(text),
	competencyRequired: optional(text),
	educationalCredentialAwarded: optional(text),
	occupationalCredentialAwarded: optional(text),

	university: optional({
		id: required(id),
		label: required(text)
	}),

	educationalLevel: multiple({
		id: required(id),
		label: required(text)
	}),

	provider: optional({
		id: required(id),
		label: required(text)
	}),

	hasCourse: multiple({
		id: required(id),
		label: required(text)
	}),

	about: multiple({
		id: required(id),
		label: required(text)
	})

});


export function DataProgram() {

	const [program]=useResource(Program);


	return <DataPage name={[Programs, {}]} info={<DataAI>{program?.generated}</DataAI>}

		tray={<TileFrame as={({

			university,
			provider,

			identifier,
			url,
			numberOfCredits,
			timeToComplete

		}) => <>

			<TileInfo>{{

				"University": university && <TileLink>{university}</TileLink>

			}}</TileInfo>

			<TileInfo>{{

				"Provider": provider && <span>{toFrameString(provider)}</span>

			}}</TileInfo>

			<TileInfo>{{

				"Code": identifier && <span>{identifier}</span>,

				"Credits": numberOfCredits && <span>{numberOfCredits.toFixed(1)}</span>,

				"Duration": timeToComplete && <span>{toPeriodString(period.decode(timeToComplete))}</span>

			}}</TileInfo>

			<TileInfo>{{

				"Info": url?.length && <ul>{url.map(item =>
					<li key={item}><a href={item}>{toIdString(item, { compact: true })}</a></li>
				)}</ul>

			}}</TileInfo>

		</>}>{program}</TileFrame>}

	>

		<TileFrame placeholder={Programs[icon]} as={({

			name,
			description,

			hasCourse,
			educationalLevel,
			about,

			teaches,
			programPrerequisites,
			assesses,
			competencyRequired,

			educationalCredentialAwarded,
			occupationalCredentialAwarded

		}) => {

			return <>

				<dfn>{toTextString(name)}</dfn>

				{description && (!teaches || toTextString(description) !== toTextString(teaches))
					&& <p>{toTextString(description)}</p>
				}

				<TilePanel stack>

					{hasCourse && <TileLabel name={"Courses"}>

                        <ul>{hasCourse.slice().sort(entryCompare).map(course =>
							<li key={course.id}><TileLink>{course}</TileLink></li>
						)}</ul>

                    </TileLabel>}

					{educationalLevel && <TileLabel name={"Level"}>

                        <ul>{educationalLevel.slice().sort(entryCompare).map(level =>
							<li key={level.id}><TileLink>{level}</TileLink></li>
						)}</ul>

                    </TileLabel>}

					{about && <TileLabel name={"Subjects"}>

                        <ul>{about.slice().sort(entryCompare).map(about =>
							<li key={about.id}><TileLink>{about}</TileLink></li>
						)}</ul>

                    </TileLabel>}

				</TilePanel>

				<TilePanel stack>{Object.entries({

					"Educational Credential Awarded": educationalCredentialAwarded,
					"Occupational Credential Awarded": occupationalCredentialAwarded,
					"General Objectives": teaches,
					"Admission Requirements": programPrerequisites,
					"Learning Objectives and Intended Skills": assesses,
					"Graduation Requirements": competencyRequired

				}).map(([

					term,
					data

				]) => data && <TileLabel key={term} name={term}>

                    <TileMark>{toTextString(data)}</TileMark>

                </TileLabel>)

				}</TilePanel>

			</>;

		}}>{program}</TileFrame>

	</DataPage>;

}
