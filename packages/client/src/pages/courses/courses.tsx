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
import { FacetSize, named, toCourseMode, toCourseTerm, toLanguage } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../tiles/search.js";


export const courses = immutable({

	route: "/courses/",
	label: "Courses",
	glyph: <Icon.BookOpen/>,

	model: {

		id: {},
		label: {},
		comment: {},

		year: {},
		university: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function CoursesPage() {

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

	const members = useMembers(collection, { model: courses.model });
	const count = useCount(collection);
	const keywords = useKeywords(collection, "label", { delay: 0 }); // the search field times the pause itself

	useEffect(() => router({ title: courses.label }), []);


	return <Page

		head={courses.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} tally={useTally(collection, "university", { label: "label", size: FacetSize })}/>
			<Tally name={"Year"} tally={useTally(collection, "year", { size: FacetSize })}/>
			<Tally name={"Term"} tally={useTally(collection, "term", { size: FacetSize })}>{named(toCourseTerm)}</Tally>
			<Tally name={"Attendance"} tally={useTally(collection, "courseMode", { size: FacetSize })}>{named(toCourseMode)}</Tally>
			<Tally name={"Language"} tally={useTally(collection, "inLanguage", { size: FacetSize })}>{named(toLanguage)}</Tally>
			<Tally name={"Fees for Externals"} tally={useTally(collection, "isAccessibleForFree", { size: FacetSize })}>{named(free => free === "true" ? "Free" : "Paid")}</Tally>
			<Range name={"Credits"} type={decimal} range={useRange(collection, "numberOfCredits")}/>
			<Tally name={"Duration"} tally={useTally(collection, "timeRequired", { size: FacetSize })}>{named(value => duration.format(value))}</Tally>
			<Tally name={"Level"} tally={useTally(collection, "educationalLevel", { label: "label", size: FacetSize })}/>
			<Tally name={"Credentials"} tally={useTally(collection, "educationalCredentialAwarded.credentialCategory", { size: FacetSize })}/>
			<Tally name={"Subjects"} tally={useTally(collection, "about", { label: "label", size: FacetSize })}/>
			<Tally name={"Audience"} tally={useTally(collection, "audience", { label: "label", size: FacetSize })}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{courses.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{courses.glyph}</Hint></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Hint>{courses.glyph}</Hint> : <>

			{state.map(({ id, label, comment, year, university }) => <Card key={id}

				title={<Link look={"strong"} href={id}>{label}</Link>}
				tags={[university?.label, year].filter(Boolean).join(" · ")}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
