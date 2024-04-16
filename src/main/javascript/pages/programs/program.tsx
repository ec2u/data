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
import { entryCompare } from "@metreeca/core/entry";
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

export const Program=immutable({

	id: required("/programs/{code}"),

	name: required(local),
	description: optional(local),

	identifier: optional(string),
	url: multiple(string),

	numberOfCredits: optional(decimal),
	timeToComplete: optional(string),

	educationalCredentialAwarded: optional(local),
	occupationalCredentialAwarded: optional(local),

	partner: optional({
		id: required(id),
		label: required(local)
	}),

	educationalLevel: optional({
		id: required(id),
		label: required(local)
	}),

	provider: optional({
		id: required(id),
		label: required(local)
	}),

	hasCourse: multiple({
		id: required(id),
		label: required(local)
	}),

	about: multiple({
		id: required(id),
		label: required(local)
	})

});


export function DataProgram() {

	const [program]=useResource(Program);

	return <DataPage name={[Programs, {}]}

		tray={<ToolFrame as={({

			partner,
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

				"University": partner && <ToolLink>{partner}</ToolLink>,
				"Provider": provider && <span>{toFrameString(provider)}</span>

			}}</ToolInfo>

			<ToolInfo>{{

				"Code": identifier && <span>{identifier}</span>,

			}}</ToolInfo>

			<ToolInfo>{{

				"Level": educationalLevel && <ToolLink>{educationalLevel}</ToolLink>,
				"Credits": numberOfCredits && <span>{numberOfCredits.toFixed(1)}</span>,
				"Duration": timeToComplete && <span>{toDurationString(duration.decode(timeToComplete))}</span>,

				"Awards": (educationalCredentialAwarded || occupationalCredentialAwarded) && <>
					{educationalCredentialAwarded && <span>{toLocalString(educationalCredentialAwarded)}</span>}
					{occupationalCredentialAwarded && <span>{toLocalString(occupationalCredentialAwarded)}</span>}
                </>

			}}</ToolInfo>

			<ToolInfo>{{

				"Info": url?.length && <ul>{url.map(item =>
					<li key={item}><a href={item}>{toIdString(item, { compact: true })}</a></li>
				)}</ul>

			}}</ToolInfo>

		</>}>{program}</ToolFrame>}

	>

		<ToolFrame placeholder={Programs[icon]} as={({

			name,
				description,

			hasCourse,
			about

			}
		) => {

			return <>

				<dfn>{toLocalString(name)}</dfn>

				{description && <ToolMark>{toLocalString(description)}</ToolMark>}

				<ToolPanel>

					{hasCourse && <ToolLabel name={"Courses"}>

                        <ul>{hasCourse.slice().sort(entryCompare).map(course =>
							<li key={course.id}><ToolLink>{course}</ToolLink></li>
						)}</ul>

                    </ToolLabel>}

					{about && <ToolLabel name={"Subjects"}>

                        <ul>{about.slice().sort(entryCompare).map(course =>
							<li key={course.id}><ToolLink>{course}</ToolLink></li>
						)}</ul>

                    </ToolLabel>}

				</ToolPanel>

			</>;
		}
		}>{program}</ToolFrame>

	</DataPage>;

}
