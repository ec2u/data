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


import { Languages } from "@ec2u/data/languages";
import { Courses } from "@ec2u/data/pages/courses/courses";
import { DataAI } from "@ec2u/data/views/ai";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { boolean } from "@metreeca/core/boolean";
import { decimal } from "@metreeca/core/decimal";
import { duration, toDurationString } from "@metreeca/core/duration";
import { entryCompare, toEntryString } from "@metreeca/core/entry";
import { toFrameString } from "@metreeca/core/frame";
import { id, toIdString } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolLabel } from "@metreeca/view/layouts/label";
import { ToolPanel } from "@metreeca/view/layouts/panel";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React, { Fragment } from "react";

export const Course=immutable({

	id: required("/courses/{code}"),

	analyzed: optional(boolean),

	name: required(local),

	url: multiple(id),

	courseCode: optional(string),
	inLanguage: multiple(string),
	numberOfCredits: optional(decimal),
	timeRequired: optional(string),
	courseWorkload: optional(string),

	teaches: optional(local),
	assesses: optional(local),
	coursePrerequisites: optional(local),
	educationalCredentialAwarded: optional(local),
	occupationalCredentialAwarded: optional(local),

	university: optional({
		id: required(id),
		label: required(local)
	}),

	provider: optional({
		id: required(id),
		label: required(local)
	}),

	educationalLevel: optional({
		id: required(id),
		label: required(local)
	}),

	audience: multiple(string),
	isAccessibleForFree: optional(boolean),

	// learningResourceType: multiple({
	// 	id: required(id),
	// 	label: required(local)
	// }),

	courseMode: optional({
		id: required(id),
		label: required(local)
	}),

	about: multiple({
		id: required(id),
		label: required(local)
	}),

	// competencyRequired: optional(local),

	inProgram: multiple({
		id: required(id),
		label: required(local)
	})

});


export function DataCourse() {

	const [course]=useResource(Course);


	return <DataPage name={[Courses, {}]} info={<DataAI>{course?.analyzed}</DataAI>}

		tray={<ToolFrame as={({

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

			}
		) => <>

			<ToolInfo>{{

				"University": university && <ToolLink>{university}</ToolLink>,
				"Provider": provider && <span>{toFrameString(provider)}</span>

			}}</ToolInfo>

			<ToolInfo>{{

				"Code": courseCode && <span>{courseCode}</span>,

				"Level": educationalLevel && <ToolLink>{educationalLevel}</ToolLink>,

				"Language": inLanguage?.length && <ul>{inLanguage
					.map(tag => toLocalString(Languages[tag]))
					.filter(language => language)
					.sort((x, y) => x.localeCompare(y))
					.map(language => <li key={language}>{language}</li>)
				}</ul>,

				"Attendance": courseMode && <span>{toEntryString(courseMode)}</span>,

				"Duration": timeRequired && <span>{toDurationString(duration.decode(timeRequired))}</span>,
				"Workload": courseWorkload && <span>{toDurationString(duration.decode(courseWorkload))}</span>,
				"Credits": numberOfCredits && <span>{numberOfCredits.toFixed(1)}</span>

			}}</ToolInfo>

			<ToolInfo>{{

				"Audience": audience?.length && <ul>{audience
					.sort((x, y) => x.localeCompare(y))
					.map(audience => <li key={audience}>{audience}</li>)
				}</ul>,

				"Fees": isAccessibleForFree === true ? "Free for Externals"
					: isAccessibleForFree === false ? "Paid for Externals"
						: undefined

			}}</ToolInfo>

			<ToolInfo>{{

				"Info": url?.length && <ul>{url.map(item =>
					<li key={item}><a href={item}>{toIdString(item, { compact: true })}</a></li>
				)}</ul>

			}}</ToolInfo>

		</>}>{course}</ToolFrame>}

	>

		<ToolFrame placeholder={Courses[icon]} as={({

			name,

			inProgram,
			about,

			teaches,
			assesses,
			coursePrerequisites,
			// competencyRequired,
			educationalCredentialAwarded,
			occupationalCredentialAwarded

		}) => {

			return <>

				<dfn>{toLocalString(name)}</dfn>

				<ToolPanel>

					{inProgram && <ToolLabel name={"Programs"}>{

						<ul>{inProgram.slice().sort(entryCompare).map(program =>
							<li key={program.id}><ToolLink>{program}</ToolLink></li>
						)}</ul>

					}</ToolLabel>}

					{about && <ToolLabel name={"Subjects"}>{

						<ul>{about.slice().sort(entryCompare).map(about =>
							<li key={about.id}><ToolLink>{about}</ToolLink></li>
						)}</ul>

					}</ToolLabel>}

				</ToolPanel>

				<ToolPanel stack>{Object.entries({

					"Educational Credential Awarded": educationalCredentialAwarded,
					"Occupational Credential Awarded": occupationalCredentialAwarded,
					"General Objectives": teaches,
					"Learning Objectives and Intended Skills": assesses,
					"Admission Requirements": coursePrerequisites
					// !!! "Teaching Methods and Mode of Study": learningResourceType,
					// "Graduation Requirements": competencyRequired,

				}).map(([

					term,
					data

				]) => data && <ToolLabel key={term} name={term}>

                    <ToolMark>{toLocalString(data)}</ToolMark>

                </ToolLabel>)

				}</ToolPanel>

			</>;

		}}>{course}</ToolFrame>

	</DataPage>;

}
