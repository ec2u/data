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
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { decimal } from "@metreeca/core/decimal";
import { duration, toDurationString } from "@metreeca/core/duration";
import { toEntryString } from "@metreeca/core/entry";
import { toFrameString } from "@metreeca/core/frame";
import { id } from "@metreeca/core/id";
import { local, toLocalString } from "@metreeca/core/local";
import { string } from "@metreeca/core/string";
import { useResource } from "@metreeca/data/models/resource";
import { icon } from "@metreeca/view";
import { ToolFrame } from "@metreeca/view/lenses/frame";
import { ToolInfo } from "@metreeca/view/widgets/info";
import { ToolLink } from "@metreeca/view/widgets/link";
import { ToolMark } from "@metreeca/view/widgets/mark";
import React, { Fragment } from "react";

export const Course=immutable({

	id: required("/courses/{code}"),

	label: required(local),
	comment: optional(local),

	url: multiple(id),

	courseCode: optional(string),
	inLanguage: multiple(string),
	numberOfCredits: optional(decimal),
	timeRequired: optional(string),

	teaches: optional(local),
	assesses: optional(local),
	coursePrerequisites: optional(local),
	educationalCredentialAwarded: optional(local),
	occupationalCredentialAwarded: optional(local),

	partner: optional({
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

	// learningResourceType: multiple({
	// 	id: required(id),
	// 	label: required(local)
	// }),

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


	return <DataPage name={[Courses, course]}

		tray={<ToolFrame as={({

				label,
			partner,
				provider,

				url,
				courseCode,
				educationalLevel,
				inLanguage,
				numberOfCredits,
				timeRequired,
				about,

				educationalCredentialAwarded,
				occupationalCredentialAwarded,

				inProgram

			}
		) => <>

			<ToolInfo>{{

				"University": partner && <ToolLink>{partner}</ToolLink>,
				"Provider": provider && <span>{toFrameString(provider)}</span>,

				"Programs": inProgram?.length && <ul>{[...inProgram]
					.sort((x, y) => toEntryString(x).localeCompare(toEntryString(y)))
					.map(program => <li key={program.id}><ToolLink>{program}</ToolLink></li>)
				}</ul>


			}}</ToolInfo>

			<ToolInfo>{{

				"Code": courseCode && <span>{courseCode}</span>,
				"Name": <span>{toLocalString(label)}</span>


			}}</ToolInfo>

			<ToolInfo>{{

				"Awards": (educationalCredentialAwarded || occupationalCredentialAwarded) && <>
					{educationalCredentialAwarded && <span>{toLocalString(educationalCredentialAwarded)}</span>}
					{occupationalCredentialAwarded && <span>{toLocalString(occupationalCredentialAwarded)}</span>}
                </>,

				"Level": educationalLevel && <ToolLink>{educationalLevel}</ToolLink>,
				"Language": inLanguage?.length && <ul>{inLanguage
					.map(tag => toLocalString(Languages[tag]))
					.filter(language => language)
					.sort((x, y) => x.localeCompare(y))
					.map(language => <li key={language}>{language}</li>)
				}</ul>,
				"Credits": numberOfCredits && <span>{numberOfCredits.toFixed(1)}</span>,
				"Duration": timeRequired && <span>{toDurationString(duration.decode(timeRequired))}</span>

			}}</ToolInfo>

			<ToolInfo>{{

				"Subjects": about && about.map(subject => <ToolLink key={subject.id}>{subject}</ToolLink>)

			}}</ToolInfo>

			<ToolInfo>{{

				"Info": url && url.map(item => {

					const url=new URL(item);

					const host=url.host;
					const lang=url.pathname.match(/\b[a-z]{2}\b/i);

					return <a key={item} href={item}>{lang ? `${host} (${lang[0].toLowerCase()})` : host}</a>;

				})

			}}</ToolInfo>

		</>}>{course}</ToolFrame>}

	>

		<ToolFrame placeholder={Courses[icon]} as={({

			comment,

			teaches,
			assesses,
			coursePrerequisites,
			// competencyRequired,
			educationalCredentialAwarded,
			occupationalCredentialAwarded

		}) => {

			const details={
				"General Objectives": teaches,
				"Learning Objectives and Intended Skills": assesses,
				"Admission Requirements": coursePrerequisites,
				// !!! "Teaching Methods and Mode of Study": learningResourceType,
				// "Graduation Requirements": competencyRequired,
				"Educational Credential Awarded": educationalCredentialAwarded,
				"Occupational Credential Awarded": occupationalCredentialAwarded
			};

			const detailed=Object.values(details).some(v => v);

			return <>

				{comment && <ToolMark>{toLocalString(comment)}</ToolMark>}

				<hr/>

				{detailed && <dl>{Object.entries(details).map(([term, data]) => data && <Fragment key={term}>

                    <dt>{term}</dt>
                    <dd><ToolMark>{toLocalString(data)}</ToolMark></dd>

                </Fragment>)

				}</dl>}


			</>;

		}}>{course}</ToolFrame>

	</DataPage>;

}
