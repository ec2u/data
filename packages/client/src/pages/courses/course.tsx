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
import { Markdown } from "@metreeca/clay-markdown/markdown";
import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Heading } from "@metreeca/clay-widgets/heading";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Infobox } from "@metreeca/clay-widgets/infobox";
import { Link } from "@metreeca/clay-widgets/link";
import { Path } from "@metreeca/clay-widgets/path";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { nameTag } from "@metreeca/core/language";
import { useResource } from "@metreeca/tile/resource";
import { duration } from "@metreeca/tile/types/duration";
import { useEffect } from "preact/hooks";
import { AI } from "../../widgets/datasets/ai.js";
import { Credential, CredentialModel } from "../../widgets/offerings/credential.js";
import { Failure } from "../../widgets/failure.js";
import { address, links, list, local } from "../../widgets/datasets/links.js";
import { Page } from "../../widgets/page.js";
import { DatasetLink } from "../../widgets/datasets/dataset.js";
import { credits } from "../programs/program.js";
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

		menu={resource({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLink href={courses.route}/>)}

		tray={resource({

			ready: ({

				state: {

					university,
					courseCode,

					year,
					term = [],

					inLanguage = [],
					courseMode,
					isAccessibleForFree,
					numberOfCredits,
					timeRequired,
					courseWorkload,

					provider,
					instructor = [],

					url = []

				}

			}) => <Infobox>{[

				{
					University: opt(university, value => <Link href={value.id}>{value.altLabel}</Link>),
					Code: courseCode
				},

				{
					Year: year,
					Term: list(term.map(toCourseTerm))
				},

				{
					Language: list(inLanguage.map(tag => nameTag(tag, navigator.language))),
					Attendance: opt(courseMode, toCourseMode),
					Fees: opt(isAccessibleForFree, free => free ? "Free" : "Paid"),
					Credits: opt(numberOfCredits, credits),
					Duration: opt(timeRequired, value => duration.format(value)),
					Workload: opt(courseWorkload, value => duration.format(value))
				},

				{
					Provider: opt(provider, ({ label }) => label),
					Instructor: list(instructor.map(({ label }) => label))
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

		blank: () => <Empty look={"subtle"}>{courses.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{courses.glyph}</Empty></Failure>,

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

		}) => <>

			<Heading>{label}</Heading>

			{description}

			<Infobox wrap>{{

				Awards: opt(educationalCredentialAwarded, value =>
					<Credential credential={value}/>),
				"Occupational Credential Awarded": opt(occupationalCredentialAwarded, value =>
					<Credential credential={value}/>),

				Programs: links(inProgram),
				Audience: links(audience),
				Level: links(educationalLevel),
				Subjects: links(about)

			}}</Infobox>

			{opt(teaches, text => <>
				<Heading>Contents and Structure</Heading>
				<Markdown>{text}</Markdown>
			</>)}

			{opt(coursePrerequisites, text => <>
				<Heading>Admission Requirements</Heading>
				<Markdown>{text}</Markdown>
			</>)}

			{opt(assesses, text => <>
				<Heading>Learning Objectives and Intended Skills</Heading>
				<Markdown>{text}</Markdown>
			</>)}

			{opt(competencyRequired, text => <>
				<Heading>Examination Requirements</Heading>
				<Markdown>{text}</Markdown>
			</>)}

		</>

	})}</Page>;

}
