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


import { Languages } from "@ec2u/data/languages";
import { Courses } from "@ec2u/data/pages/courses/courses";
import { toEventAttendanceModeString } from "@ec2u/data/pages/things/things";
import { DataAI } from "@ec2u/data/views/ai";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { decimal } from "@metreeca/core/decimal";
import { duration, toDurationString } from "@metreeca/core/duration";
import { entryCompare } from "@metreeca/core/entry";
import { toFrameString } from "@metreeca/core/frame";
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
import React, { Fragment } from "react";

export const Course=immutable({

	id: required("/courses/{code}"),

	generated: optional(boolean),

	name: required(text),

	url: multiple(id),

	courseCode: optional(string),
	inLanguage: multiple(string),
	numberOfCredits: optional(decimal),
	timeRequired: optional(duration),
	courseWorkload: optional(duration),

	teaches: optional(text),
	assesses: optional(text),
	coursePrerequisites: optional(text),
	competencyRequired: optional(text),
	educationalCredentialAwarded: optional(text),
	occupationalCredentialAwarded: optional(text),

	university: optional({
		id: required(id),
		label: required(text)
	}),

	provider: optional({
		id: required(id),
		label: required(text)
	}),

	educationalLevel: optional({
		id: required(id),
		label: required(text)
	}),

	audience: multiple({
		id: required(id),
		label: required(text)
	}),

	isAccessibleForFree: optional(boolean),

	courseMode: optional(string),

	about: multiple({
		id: required(id),
		label: required(text)
	}),

	inProgram: multiple({
		id: required(id),
		label: required(text)
	})

});


export function DataCourse() {

	const [course]=useResource(Course);


	return <DataPage name={[Courses, {}]} info={<DataAI>{course?.generated}</DataAI>}

		tray={<TileFrame as={({

			university,
			provider,

			url,
			courseCode,
			educationalLevel,
			audience,
			inLanguage,
			numberOfCredits,
			timeRequired,
			courseWorkload,
			courseMode,
			isAccessibleForFree

		}) => <>

			<TileInfo>{{

				"University": university && <TileLink>{university}</TileLink>,
				"Provider": provider && <span>{toFrameString(provider)}</span>

			}}</TileInfo>

			<TileInfo>{{

				"Code": courseCode && <span>{courseCode}</span>,

				"Level": educationalLevel && <TileLink>{educationalLevel}</TileLink>,

				"Language": inLanguage?.length && <ul>{inLanguage
					.map(tag => toTextString(Languages[tag]))
					.filter(language => language)
					.sort((x, y) => x.localeCompare(y))
					.map(language => <li key={language}>{language}</li>)
				}</ul>,

				"Attendance": courseMode && <span>{toEventAttendanceModeString(courseMode)}</span>,

				"Duration": timeRequired && <span>{toDurationString(duration.decode(timeRequired))}</span>,
				"Workload": courseWorkload && <span>{toDurationString(duration.decode(courseWorkload))}</span>,
				"Credits": numberOfCredits && <span>{numberOfCredits.toFixed(1)}</span>

			}}</TileInfo>

			<TileInfo>{{

				"Audience": audience?.length && <ul>{audience.slice().sort(entryCompare).map(audience =>
					<li key={audience.id}><TileLink>{audience}</TileLink></li>
				)}</ul>,

				"Fees": isAccessibleForFree === true ? "Free for Externals"
					: isAccessibleForFree === false ? "Paid for Externals"
						: undefined

			}}</TileInfo>

			<TileInfo>{{

				"Info": url?.length && <ul>{url.map(item =>
					<li key={item}><a href={item}>{toIdString(item, { compact: true })}</a></li>
				)}</ul>

			}}</TileInfo>

		</>}>{course}</TileFrame>}

	>

		<TileFrame placeholder={Courses[icon]} as={({

			name,

			inProgram,
			about,

			teaches,
			assesses,
			coursePrerequisites,
			competencyRequired,
			educationalCredentialAwarded,
			occupationalCredentialAwarded

		}) => {

			return <>

				<dfn>{toTextString(name)}</dfn>

				<TilePanel stack>

					{about && <TileLabel name={"Subjects"}>{

						<ul>{about.slice().sort(entryCompare).map(about =>
							<li key={about.id}><TileLink>{about}</TileLink></li>
						)}</ul>

					}</TileLabel>}

					{inProgram && <TileLabel name={"Programs"}>{

						<ul>{inProgram.slice().sort(entryCompare).map(program =>
							<li key={program.id}><TileLink>{program}</TileLink></li>
						)}</ul>

					}</TileLabel>}

				</TilePanel>

				<TilePanel stack>{Object.entries({

					"Educational Credential Awarded": educationalCredentialAwarded,
					"Occupational Credential Awarded": occupationalCredentialAwarded,
					"General Objectives": teaches,
					"Learning Objectives and Intended Skills": assesses,
					"Admission Requirements": coursePrerequisites,
					"Examination Requirements": competencyRequired

				}).map(([

					term,
					data

				]) => data && <TileLabel key={term} name={term}>

                    <TileMark>{toTextString(data)}</TileMark>

                </TileLabel>)

				}</TilePanel>

			</>;

		}}>{course}</TileFrame>

	</DataPage>;

}
