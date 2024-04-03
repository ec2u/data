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


import { Programs } from "@ec2u/data/pages/programs/programs";
import { DataPage } from "@ec2u/data/views/page";
import { immutable, multiple, optional, required } from "@metreeca/core";
import { decimal } from "@metreeca/core/decimal";
import { duration, toDurationString } from "@metreeca/core/duration";
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

export const Program=immutable({

	id: required("/programs/{code}"),

	label: required(local),
	comment: optional(local),

	identifier: optional(string),
	url: multiple(string),

	description: required(local),

	numberOfCredits: optional(decimal),
	timeToComplete: optional(string),

	educationalCredentialAwarded: optional(local),
	occupationalCredentialAwarded: optional(local),

	owner: optional({
		id: optional(id),
		label: required(local)
	}),

	educationalLevel: optional({
		id: optional(id),
		label: required(local)
	}),

	provider: optional({
		id: optional(id),
		label: required(local)
	}),

	hasCourse: multiple({
		id: optional(id),
		label: required(local)
	}),

	about: multiple({
		id: optional(id),
		label: required(local)
	})

});


export function DataProgram() {

	const [program]=useResource(Program);

	return <DataPage name={[Programs, program]}

		tray={<ToolFrame as={({

			label,
			owner,
			provider,

			identifier,
			url,
			educationalLevel,
			numberOfCredits,
			timeToComplete,
			about,

			educationalCredentialAwarded,
			occupationalCredentialAwarded

		}) => <>

			<ToolInfo>{{

				"University": owner && <ToolLink>{owner}</ToolLink>,
				"Provider": provider && <span>{toFrameString(provider)}</span>

			}}</ToolInfo>

			<ToolInfo>{{

				"Code": identifier && <span>{identifier}</span>,
				"Name": <span>{toLocalString(label)}</span>


			}}</ToolInfo>

			<ToolInfo>{{

				"Awards": (educationalCredentialAwarded || occupationalCredentialAwarded) && <>
					{educationalCredentialAwarded && <span>{toLocalString(educationalCredentialAwarded)}</span>}
					{occupationalCredentialAwarded && <span>{toLocalString(occupationalCredentialAwarded)}</span>}
                </>,

				"Level": educationalLevel && <span>{toFrameString(educationalLevel)}</span>,
				"Credits": numberOfCredits && <span>{numberOfCredits.toFixed(1)}</span>,
				"Duration": timeToComplete && <span>{toDurationString(duration.decode(timeToComplete))}</span>

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

		</>}>{program}</ToolFrame>}

	>

		<ToolFrame placeholder={Programs[icon]} as={({

				description,

				educationalCredentialAwarded,
				occupationalCredentialAwarded,

				hasCourse

			}
		) => {

			const details={
				"Educational Credential Awarded": educationalCredentialAwarded,
				"Occupational Credential Awarded": occupationalCredentialAwarded
			};

			const detailed=Object.values(details).some(v => v);


			return <>

				{description && <ToolMark>{toLocalString(description)}</ToolMark>}

				<hr/>

				{detailed && <dl>{Object.entries(details).map(([term, data]) => data && <Fragment key={term}>

                    <dt>{term}</dt>
                    <dd><ToolMark>{toLocalString(data)}</ToolMark></dd>

                </Fragment>)

				}</dl>}

				{hasCourse?.length && <>

                    <h1>Courses</h1>

                    <ul>{[...hasCourse]
						.sort((x, y) => toFrameString(x).localeCompare(toFrameString(y)))
						.map(course => <li key={course.id}><ToolLink>{course}</ToolLink></li>)
					}</ul>

                </>}

			</>;
		}
		}>{program}</ToolFrame>

	</DataPage>;

}
