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
import { Card } from "@metreeca/clay-widgets/card";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { More } from "@metreeca/clay-widgets/more";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { nameTag } from "@metreeca/core/language";
import { Clear } from "@metreeca/tile-widgets/filters/clear";
import { Range } from "@metreeca/tile-widgets/filters/range";
import { Search } from "@metreeca/tile-widgets/filters/search";
import { Tally } from "@metreeca/tile-widgets/filters/tally";
import { Count } from "@metreeca/tile-widgets/viewers/count";
import { useCollection } from "@metreeca/tile/collection";
import { useCount } from "@metreeca/tile/count";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useRange } from "@metreeca/tile/range";
import { useSearch } from "@metreeca/tile/search";
import { useTally } from "@metreeca/tile/tally";
import { decimal } from "@metreeca/tile/types/decimal";
import { duration } from "@metreeca/tile/types/duration";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { DatasetLinks } from "../datasets/dataset.js";
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
	const count = useCount(collection);

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},

			university: { altLabel: {} }

		}

	});


	useEffect(() => router({ title: courses.label }), []);


	return <Page

		head={courses.label}
		menu={<DatasetLinks/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

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

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Empty>{courses.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{courses.glyph}</Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty>{courses.glyph}</Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id}

				title={<Link href={id}>{label}</Link>}
				badge={university?.altLabel}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
