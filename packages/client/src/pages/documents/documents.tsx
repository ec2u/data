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

import { Documents } from "@ec2u/data-shared/documents/index.js";
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
import { useEffect } from "preact/hooks";
import { FacetSize, named, toLanguage } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../tiles/search.js";


export const documents = immutable({

	route: "/documents/",
	label: "Documents",
	glyph: <Icon.Files/>,

	model: {

		id: {},
		label: {},
		comment: {},

		university: { id: {}, label: {} }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DocumentsPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({
		entry: route,
		shape: Documents,
		field: "resources",
		criteria: query,
		onChange: setQuery
	});

	const members = useMembers(collection, { model: documents.model });
	const count = useCount(collection);
	const keywords = useKeywords(collection, "label", { delay: 0 }); // the search field times the pause itself

	useEffect(() => router({ title: documents.label }), []);


	return <Page

		head={documents.label}
		menu={<Button icon={<Icon.Help/>} title={"Help"}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} tally={useTally(collection, "university", { label: "label", size: FacetSize })}/>
			<Tally name={"Type"} tally={useTally(collection, "type", { label: "label", size: FacetSize })}/>
			<Tally name={"Audience"} tally={useTally(collection, "audience", { label: "label", size: FacetSize })}/>
			<Tally name={"Topic"} tally={useTally(collection, "subject", { label: "label", size: FacetSize })}/>
			<Tally name={"Language"} tally={useTally(collection, "language", { size: FacetSize })}>{named(toLanguage)}</Tally>
			<Tally name={"License"} tally={useTally(collection, "license", { label: "label", size: FacetSize })}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{documents.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{documents.glyph}</Hint></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Hint>{documents.glyph}</Hint> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id}

				title={<Link look={"strong"} href={id}>{label}</Link>}
				tags={university?.label ?? "EC2U Alliance"}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
