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
import { credential } from "../programs/program.js";
import { courses } from "./courses.js";


export const course = immutable({

	route: "/:course",
	label: "Course",
	glyph: <Icon.BookOpen/>,

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

		educationalCredentialAwarded: { name: {}, credentialCategory: {} },
		occupationalCredentialAwarded: { name: {}, credentialCategory: {} },

		university: { id: {}, label: {} },
		provider: { id: {}, label: {} },
		instructor: { id: {}, label: {} },

		inProgram: { id: {}, label: {} },
		audience: { id: {}, label: {} },
		educationalLevel: { id: {}, label: {} },
		about: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function CoursePage() {

	const route = useRoute();
	const router = useRouter();

	const resource = useResource({
		entry: route,
		shape: Course,
		model: course.model
	});

	const title = resource({

		blank: courses.label,
		error: courses.label,

		ready: ({ state }) => state.label

	});

	useEffect(() => router({ title }), [title]);


	return <Page

		head={<Path>

			<Link look={"subtle"} href={courses.route}>{courses.label}</Link>

		</Path>}

		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

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

					Source: url.length > 0 ? <ul>{url.map(url =>
						<li key={url}><Link look={"strong"} href={url}>{site(url)}</Link></li>
					)}</ul> : undefined

				}}</Info>

				<Info place={"spread"}>{{

					University: opt(university, ({ id, label }) => <Link look={"strong"} href={id}>{label}</Link>),
					Year: year,
					Term: term.length > 0 ? term.join(", ") : undefined

				}}</Info>

				<Info place={"spread"}>{{

					Provider: opt(provider, ({ label }) => label),
					Instructor: links(instructor, "strong")

				}}</Info>

				<Info place={"spread"}>{{

					Code: courseCode,
					Attendance: courseMode,
					Language: inLanguage.length > 0 ? inLanguage.join(", ") : undefined,
					"Fees for Externals": opt(isAccessibleForFree, free => free ? "Free" : "Paid"),
					Credits: opt(numberOfCredits, credits => credits.toLocaleString()),
					Duration: timeRequired,
					Workload: courseWorkload

				}}</Info>

			</>

		})}

		info={resource({

			ready: ({ state: { generated } }) => <AI>{generated}</AI>

		})}

	>{resource({

		blank: () => <Hint>{course.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{course.glyph}</Hint></Failure>,

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

			<Card title={label}>{description}</Card>

			<Info>{{

				"Educational Credential Awarded": opt(educationalCredentialAwarded, credential),
				"Occupational Credential Awarded": opt(occupationalCredentialAwarded, credential),

				Programs: links(inProgram),
				Audience: links(audience),
				Level: links(educationalLevel),
				Subjects: links(about)

			}}</Info>

			<Info>{{

				"Contents and Structure": teaches,
				"Admission Requirements": coursePrerequisites,
				"Learning Objectives and Intended Skills": assesses,
				"Examination Requirements": competencyRequired

			}}</Info>

		</>

	})}</Page>;

}
