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
import { opt } from "@metreeca/core";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { More } from "@metreeca/tile-cell/more";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useKeywords, useMembers, useQuery, useRange, useTally } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Clear } from "@metreeca/tile-lens/clear";
import { Count } from "@metreeca/tile-lens/count";
import { Range } from "@metreeca/tile-lens/range";
import { Tally } from "@metreeca/tile-lens/tally";
import { decimal } from "@metreeca/tile-type/decimal";
import { duration } from "@metreeca/tile-type/duration";
import { useEffect } from "preact/hooks";
import { FacetSize, named, toCourseMode, toCourseTerm, toLanguage, toUniversity, UniversityModel } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../tiles/search.js";
import { DatasetLink, DatasetPage } from "../datasets/dataset.js";


export const courses = immutable({

	route: "/courses/",
	label: "Courses",
	glyph: <Icon.BookOpen/>,

	model: {

		id: {},
		label: {},
		comment: {},

		university: UniversityModel

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function CoursesInfo() {

	return <DatasetPage href={courses.route} label={courses.label} glyph={courses.glyph}/>;

}

export function CoursesData() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({
		entry: route,
		shape: Courses,
		field: "resources",
		criteria: query,
		onChange: setQuery
	});

	const keywords = useKeywords(collection, "label", { delay: 0 }); // the search field times the pause itself
	const university = useTally(collection, "university", { label: "altLabel", size: FacetSize });
	const year = useTally(collection, "year", { size: FacetSize });
	const term = useTally(collection, "term", { size: FacetSize });
	const courseMode = useTally(collection, "courseMode", { size: FacetSize });
	const inLanguage = useTally(collection, "inLanguage", { size: FacetSize });
	const isAccessibleForFree = useTally(collection, "isAccessibleForFree", { size: FacetSize });
	const numberOfCredits = useRange(collection, "numberOfCredits");
	const timeRequired = useTally(collection, "timeRequired", { size: FacetSize });
	const educationalLevel = useTally(collection, "educationalLevel", { label: "label", size: FacetSize });
	const credentialCategory = useTally(collection, "educationalCredentialAwarded.credentialCategory", { size: FacetSize });
	const about = useTally(collection, "about", { label: "label", size: FacetSize });
	const audience = useTally(collection, "audience", { label: "label", size: FacetSize });
	const count = useCount(collection);

	const members = useMembers(collection, { model: courses.model });

	useEffect(() => router({ title: courses.label }), []);


	return <Page

		head={courses.label}
		menu={<DatasetLink href={courses.route}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} compact={false} tally={university}/>
			<Tally name={"Year"} compact tally={year}/>
			<Tally name={"Term"} compact tally={term}>{named(toCourseTerm)}</Tally>
			<Tally name={"Attendance"} compact tally={courseMode}>{named(toCourseMode)}</Tally>
			<Tally name={"Language"} compact tally={inLanguage}>{named(toLanguage)}</Tally>
			<Tally name={"Fees for Externals"} compact tally={isAccessibleForFree}>{named(free => free === "true" ? "Free" : "Paid")}</Tally>
			<Range name={"Credits"} compact type={decimal} range={numberOfCredits}/>
			<Tally name={"Duration"} compact tally={timeRequired}>{named(value => duration.format(value))}</Tally>
			<Tally name={"Level"} compact tally={educationalLevel}/>
			<Tally name={"Credentials"} compact tally={credentialCategory}/>
			<Tally name={"Subjects"} compact tally={about}/>
			<Tally name={"Audience"} compact tally={audience}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{courses.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{courses.glyph}</Hint></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Hint>{courses.glyph}</Hint> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id}

				title={<Link href={id}>{label}</Link>}
				tags={opt(university, toUniversity)}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
