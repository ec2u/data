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
import { opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Info } from "@metreeca/tile-hive/info";
import { useEffect } from "preact/hooks";
import { site } from "../../index.core.js";
import { AI } from "../../tiles/ai.js";
import { Failure } from "../../tiles/failure.js";
import { links } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { programs } from "./programs.js";


export const program = immutable({

	route: "/:program",
	label: "Program",
	glyph: <Icon.GraduationCap/>,

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

		educationalCredentialAwarded: { name: {}, credentialCategory: {} },
		occupationalCredentialAwarded: { name: {}, credentialCategory: {} },

		university: { id: {}, label: {} },
		provider: { id: {}, label: {} },

		hasCourse: { id: {}, label: {} },
		educationalLevel: { id: {}, label: {} },
		about: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ProgramPage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: Program,
		model: program.model
	});

	const title = resource({

		blank: programs.label,
		error: programs.label,

		ready: ({ state }) => state.label

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link look={"subtle"} href={programs.route}>{programs.label}</Link>

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({ state: { url = [], university, provider, identifier, numberOfCredits, timeToComplete } }) => <>

				<Info place={"spread"}>{{

					Source: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>
					)}</ul> : undefined

				}}</Info>

				<Info place={"spread"}>{{

					University: opt(university, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>),
					Provider: opt(provider, ({ label }) => label)

				}}</Info>

				<Info place={"spread"}>{{

					Code: identifier,
					Credits: opt(numberOfCredits, credits => credits.toLocaleString()),
					Duration: timeToComplete

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{program.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{program.glyph}</Hint></Failure>,

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

			<Card title={label}>{description !== teaches ? description : undefined}</Card>

			<Info>{{

				"Educational Credential Awarded": opt(educationalCredentialAwarded, credential),
				"Occupational Credential Awarded": opt(occupationalCredentialAwarded, credential),

				Courses: links(hasCourse),
				Level: links(educationalLevel),
				Subjects: links(about)

			}}</Info>

			<Info>{{

				"Contents and Structure": teaches,
				"Admission Requirements": programPrerequisites,
				"Learning Objectives and Intended Skills": assesses,
				"Graduation Requirements": competencyRequired

			}}</Info>

		</>

	})}</Page>;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Formats a credential awarded on completion of an educational offering.
 *
 * @param credential The credential to be formatted
 *
 * @returns The name of the credential followed by its bracketed category, or the category alone if it has no name
 */
export function credential({ name, credentialCategory }: {

	readonly name?: string
	readonly credentialCategory: string

}): string {

	return name ? `${name} (${credentialCategory})` : credentialCategory;

}
