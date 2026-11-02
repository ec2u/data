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

import { Programs } from "@ec2u/data-shared/programs/index.js";
import { immutable } from "@metreeca/core/values";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { More } from "@metreeca/tile-cell/more";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import { useCollection, useCount, useKeywords, useMembers, useQuery, useTally } from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Clear } from "@metreeca/tile-lens/clear";
import { Count } from "@metreeca/tile-lens/count";
import { Tally } from "@metreeca/tile-lens/tally";
import { duration } from "@metreeca/tile-type/duration";
import { useEffect } from "preact/hooks";
import { FacetSize, named } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../tiles/search.js";


export const programs = immutable({

	route: "/programs/",
	label: "Programs",
	glyph: <Icon.GraduationCap/>,

	model: {

		id: {},
		label: {},
		comment: {},

		year: {},

		university: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ProgramsPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({
		entry: route,
		shape: Programs,
		field: "resources",
		criteria: query,
		onChange: setQuery
	});

	const members = useMembers(collection, { model: programs.model });
	const count = useCount(collection);
	const keywords = useKeywords(collection, "label", { delay: 0 }); // the search field times the pause itself

	useEffect(() => router({ title: programs.label }), []);


	return <Page

		head={programs.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} tally={useTally(collection, "university", { label: "label", size: FacetSize })}/>
			<Tally name={"Level"} tally={useTally(collection, "educationalLevel", { label: "label", size: FacetSize })}/>
			<Tally name={"Duration"} tally={useTally(collection, "timeToComplete", { size: FacetSize })}>{named(value => duration.format(value))}</Tally>
			<Tally name={"Subjects"} tally={useTally(collection, "about", { label: "label", size: FacetSize })}/>
			<Tally name={"Provider"} tally={useTally(collection, "provider", { label: "label", size: FacetSize })}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{programs.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{programs.glyph}</Hint></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Hint>{programs.glyph}</Hint> : <>

			{state.map(({ id, label, comment, year, university }) => <Card key={id}

				title={<Link look={"strong"} href={id}>{label}</Link>}
				tags={[university?.label, year].filter(Boolean).join(" · ")}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
