/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { Program } from "@ec2u/data-shared/programs/index.js";
import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Heading } from "@metreeca/clay-widgets/heading";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Link } from "@metreeca/clay-widgets/link";
import { Path } from "@metreeca/clay-widgets/path";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { useResource } from "@metreeca/tile/resource";
import { decimal } from "@metreeca/tile/types/decimal";
import { duration } from "@metreeca/tile/types/duration";
import { useEffect } from "preact/hooks";
import { AI } from "../../widgets/ai.js";
import { Credential, CredentialModel } from "../../widgets/credential.js";
import { Failure } from "../../widgets/failure.js";
import { address, links, local } from "../../widgets/links.js";
import { Page } from "../../widgets/page.js";
import { blocks, sections } from "../../widgets/sections.js";
import { DatasetLink } from "../../widgets/dataset.js";
import { programs } from "./index.js";


/**
 * Formats a number of credits for display, with one fractional digit.
 *
 * @param value The number of credits to be formatted
 *
 * @returns The localised number, rounded or padded to one fractional digit
 */
export function credits(value: number): string {
	return decimal.format(value, { fractionDigits: 1 });
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ProgramPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({

		entry: route,
		shape: Program,

		model: {

			id: {},
			generated: {},

			label: {},
			description: {},

			identifier: {},
			url: {},

			numberOfCredits: {},
			timeToComplete: {},

			teaches: {},
			programPrerequisites: {},
			assesses: {},
			competencyRequired: {},

			educationalCredentialAwarded: CredentialModel,
			occupationalCredentialAwarded: CredentialModel,

			university: { id: {}, altLabel: {} },
			provider: { id: {}, label: {} },

			hasCourse: { id: {}, label: {} },
			educationalLevel: { id: {}, label: {} },
			about: { id: {}, label: {} }

		}

	});

	const title = resource({

		blank: programs.label,
		error: programs.label,

		ready: ({ state }) => state.label

	});


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={programs.route}>{programs.label}</Link>

		</Path>}

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={programs.route}/>)}

		tray={resource({

			ready: ({
				state: { url = [], university, identifier, numberOfCredits, timeToComplete, provider }
			}) => <Infobox>{[

				{
					University: opt(university, value => <Link href={value.id}>{value.altLabel}</Link>),
					Code: identifier
				},

				{
					Credits: opt(numberOfCredits, credits),
					Duration: opt(timeToComplete, value => duration.format(value))
				},

				{
					Provider: opt(provider, ({ label }) => label)
				},

				{
					Web: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}>{address(url, local(university?.id))}</li>
					)}</ul> : undefined
				}

			]}</Infobox>

		})}

		more={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Empty look={"subtle"}>{programs.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{programs.glyph}</Empty></Failure>,

		ready: ({

			state: {

				label,
				description,

				teaches,
				programPrerequisites,
				assesses,
				competencyRequired,

				educationalCredentialAwarded,
				occupationalCredentialAwarded,

				hasCourse = [],
				educationalLevel = [],
				about = []

			}

		}) => <>

			<Heading>{label}</Heading>

			{description !== teaches ? description : undefined}

			{blocks({

				Awards: opt(educationalCredentialAwarded, value =>
					<Credential credential={value}/>),
				"Occupational Credential Awarded": opt(occupationalCredentialAwarded, value =>
					<Credential credential={value}/>),

				Courses: links(hasCourse),
				Level: links(educationalLevel),
				Subjects: links(about)

			})}

			{sections({

				"Contents and Structure": teaches,
				"Admission Requirements": programPrerequisites,
				"Learning Objectives and Intended Skills": assesses,
				"Graduation Requirements": competencyRequired

			})}

		</>

	})}</Page>;

}
