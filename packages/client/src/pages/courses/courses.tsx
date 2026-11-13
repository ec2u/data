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
import { Button } from "@metreeca/clay-widgets/button";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { More } from "@metreeca/clay-widgets/more";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { nameTag } from "@metreeca/core/language";
import { Clear } from "@metreeca/tile-widgets/clear";
import { Facets } from "@metreeca/tile-widgets/facets";
import { Range } from "@metreeca/tile-widgets/range";
import { Search } from "@metreeca/tile-widgets/search";
import { Tally } from "@metreeca/tile-widgets/tally";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useRange } from "@metreeca/tile/range";
import { useSearch } from "@metreeca/tile/search";
import { useTally } from "@metreeca/tile/tally";
import { decimal } from "@metreeca/tile/types/decimal";
import { duration } from "@metreeca/tile/types/duration";
import { useEffect } from "preact/hooks";
import { Card } from "../../_/clay-widgets/card.js";
import { TallyOptions } from "../../index.core.js";
import { AI } from "../../widgets/datasets/ai.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { Size } from "../../widgets/datasets/size.js";
import { color } from "../../widgets/datasets/links.js";
import { DatasetLinks } from "../../widgets/datasets/dataset.js";
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

		more={<AI/>}

		meta={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty look={"subtle"}>{courses.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{courses.glyph}</Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty>{courses.glyph}</Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id}

				title={<Link href={id}>{label}</Link>}
				badge={university?.altLabel}
				color={color(university?.id)}
				glyph={courses.glyph}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
