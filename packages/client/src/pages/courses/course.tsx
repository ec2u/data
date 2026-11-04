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

import { Course } from "@ec2u/data-shared/courses/index.js";
import { opt } from "@metreeca/core";
import { nameTag } from "@metreeca/core/language";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Path } from "@metreeca/tile-cell/path";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useResource } from "@metreeca/tile-data/store";
import { Info } from "@metreeca/tile-hive/info";
import { Stack } from "@metreeca/tile-hive/stack";
import { duration } from "@metreeca/tile-type/duration";
import { useEffect } from "preact/hooks";
import { AI } from "../../tiles/ai.js";
import { Credential, CredentialModel } from "../../tiles/credential.js";
import { Failure } from "../../tiles/failure.js";
import { address, links, list } from "../../tiles/links.js";
import { Page } from "../../tiles/page.js";
import { blocks, sections } from "../../tiles/sections.js";
import { Title } from "../../tiles/title.js";
import { credits } from "../programs/program.js";
import { DatasetLink } from "../datasets/dataset.js";
import { toCourseMode, toCourseTerm } from "./index.core.js";
import { courses } from "./index.js";


export function CoursePage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({

		entry: route,
		shape: Course,

		model: {

			id: {},
			generated: {},

			label: {},
			description: {},

			url: {},

			year: {},
			term: {},

			courseCode: {},
			inLanguage: {},
			numberOfCredits: {},
			timeRequired: {},
			courseWorkload: {},
			courseMode: {},
			isAccessibleForFree: {},

			teaches: {},
			coursePrerequisites: {},
			assesses: {},
			competencyRequired: {},

			educationalCredentialAwarded: CredentialModel,
			occupationalCredentialAwarded: CredentialModel,

			university: { id: {}, altLabel: {} },
			provider: { id: {}, label: {} },
			instructor: { id: {}, label: {} },

			inProgram: { id: {}, label: {} },
			audience: { id: {}, label: {} },
			educationalLevel: { id: {}, label: {} },
			about: { id: {}, label: {} }

		}

	});

	const title = resource({

		blank: courses.label,
		error: courses.label,

		ready: ({ state }) => state.label

	});


	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link href={courses.route}>{courses.label}</Link>

		</Path>}

		menu={<DatasetLink href={courses.route}/>}

		back={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={resource({

			ready: ({

				state: {

					url = [],

					university,
					year,
					term = [],

					provider,
					instructor = [],

					courseCode,
					courseMode,
					inLanguage = [],
					isAccessibleForFree,
					numberOfCredits,
					timeRequired,
					courseWorkload

				}

			}) => <>

				<Info place={"spread"}>{{

					University: opt(university, value => <Link href={value.id}>{value.altLabel}</Link>),
					Year: year,
					Term: list(term.map(toCourseTerm))

				}}</Info>

				<Info place={"spread"}>{{

					Provider: opt(provider, ({ label }) => label),
					Instructor: list(instructor.map(({ label }) => label))

				}}</Info>

				<Info place={"spread"}>{{

					Code: courseCode,
					Attendance: opt(courseMode, toCourseMode),
					Language: list(inLanguage.map(tag => nameTag(tag, navigator.language))),
					"Fees for Externals": opt(isAccessibleForFree, free => free ? "Free" : "Paid"),
					Credits: opt(numberOfCredits, value => credits.format(value)),
					Duration: opt(timeRequired, value => duration.format(value)),
					Workload: opt(courseWorkload, value => duration.format(value))

				}}</Info>

				<Info place={"spread"}>{{

					Info: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}>{address(url)}</li>
					)}</ul> : undefined

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{courses.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{courses.glyph}</Hint></Failure>,

		ready: ({

			state: {

				label,
				description,

				teaches,
				coursePrerequisites,
				assesses,
				competencyRequired,

				educationalCredentialAwarded,
				occupationalCredentialAwarded,

				inProgram = [],
				audience = [],
				educationalLevel = [],
				about = []

			}

		}) => <Stack space={"spacing100"}>

			<Title title={label}>{description}</Title>

			{blocks({

				"Educational Credential Awarded": opt(educationalCredentialAwarded, value =>
					<Credential credential={value}/>),
				"Occupational Credential Awarded": opt(occupationalCredentialAwarded, value =>
					<Credential credential={value}/>),

				Programs: links(inProgram),
				Audience: links(audience),
				Level: links(educationalLevel),
				Subjects: links(about)

			})}

			{sections({

				"Contents and Structure": teaches,
				"Admission Requirements": coursePrerequisites,
				"Learning Objectives and Intended Skills": assesses,
				"Examination Requirements": competencyRequired

			})}

		</Stack>

	})}</Page>;

}
