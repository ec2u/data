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

import { Courses } from "@ec2u/data-shared/courses/index.js";
import { Button } from "@grafctory/clay-widgets/button";
import { Card } from "@grafctory/clay-widgets/card";
import { Empty } from "@grafctory/clay-widgets/empty";
import { Icon } from "@grafctory/clay-widgets/icon";
import { Link } from "@grafctory/clay-widgets/link";
import { More } from "@grafctory/clay-widgets/more";
import { Pill } from "@grafctory/clay-widgets/pill";
import { useRoute, useRouter } from "@grafctory/clay/router";
import { opt } from "@grafctory/core";
import { nameTag } from "@grafctory/core/language";
import { Clear } from "@grafctory/tile-widgets/clear";
import { Facets } from "@grafctory/tile-widgets/facets";
import { Range } from "@grafctory/tile-widgets/range";
import { Search } from "@grafctory/tile-widgets/search";
import { Tally } from "@grafctory/tile-widgets/tally";
import { useCollection } from "@grafctory/tile/collection";
import { useMembers } from "@grafctory/tile/members";
import { useQuery } from "@grafctory/tile/query";
import { useRange } from "@grafctory/tile/range";
import { useSearch } from "@grafctory/tile/search";
import { useTally } from "@grafctory/tile/tally";
import { decimal } from "@grafctory/tile/types/decimal";
import { duration } from "@grafctory/tile/types/duration";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { DatasetLinks } from "../../widgets/datasets/dataset.js";
import { color } from "../../widgets/datasets/links.js";
import { Size } from "../../widgets/datasets/size.js";
import { Failure } from "../../widgets/failure.js";
import { Feedback } from "../../widgets/feedback.js";
import { Page } from "../../widgets/page.js";
import { toCourseMode, toCourseTerm } from "./index.core.js";
import { courses } from "./index.js";


export function CoursesPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({

		entry: route,
		shape: Courses,
		field: "resources",

		query,

		onChange: setQuery

	});

	const search = useSearch(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const year = useTally(collection, "year", { size: TallyOptions });
	const term = useTally(collection, "term", { size: TallyOptions });
	const courseMode = useTally(collection, "courseMode", { size: TallyOptions });
	const inLanguage = useTally(collection, "inLanguage", { size: TallyOptions });
	const isAccessibleForFree = useTally(collection, "isAccessibleForFree", { size: TallyOptions });
	const numberOfCredits = useRange(collection, "numberOfCredits");
	const timeRequired = useTally(collection, "timeRequired", { size: TallyOptions });
	const educationalLevel = useTally(collection, "educationalLevel", { label: "label", size: TallyOptions });
	const credentialCategory = useTally(collection, "educationalCredentialAwarded.credentialCategory", { size: TallyOptions });
	const about = useTally(collection, "about", { label: "label", size: TallyOptions });
	const audience = useTally(collection, "audience", { label: "label", size: TallyOptions });

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},

			university: { id: {}, altLabel: {} }

		},

		order: { label: "asc" }

	});


	useEffect(() => router({ title: courses.label }), []);


	return <Page

		gist={query}

		head={<Size label={courses.label} collection={collection}/>}
		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<Facets>

			<Search name={"Name"} search={search}/>

			<Tally name={"University"} tally={university}/>
			<Tally name={"Year"} collapsed tally={year}/>
			<Tally name={"Term"} collapsed tally={term}>{({ label }) => toCourseTerm(label)}</Tally>
			<Tally name={"Attendance"} collapsed tally={courseMode}>{({ label }) => toCourseMode(label)}</Tally>
			<Tally name={"Language"} collapsed tally={inLanguage}>{({ label }) => nameTag(label, navigator.language)}</Tally>
			<Tally name={"Fees for Externals"} collapsed tally={isAccessibleForFree}>{({ label }) => label === "true" ? "Free" : "Paid"}</Tally>
			<Range name={"Credits"} collapsed type={decimal} range={numberOfCredits}/>
			<Tally name={"Duration"} collapsed tally={timeRequired}>{({ label }) => duration.format(label)}</Tally>
			<Tally name={"Level"} collapsed tally={educationalLevel}/>
			<Tally name={"Credentials"} collapsed tally={credentialCategory}/>
			<Tally name={"Subjects"} collapsed tally={about}/>
			<Tally name={"Audience"} collapsed tally={audience}/>

		</Facets>}

		more={<Feedback ai/>}

		meta={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty look={"subtle"}><courses.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><courses.glyph/></Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty><courses.glyph/></Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id} lines={3}

				title={<Link href={id}>{label}</Link>}
				badge={opt(university?.altLabel, label => <Pill color={color(university?.id)}>{label}</Pill>)}
				image={comment && <Empty><courses.glyph/></Empty>}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
