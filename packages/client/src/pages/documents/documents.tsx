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
import { nameTag } from "@metreeca/core/language";
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
import { TallyOptions } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../_/search.js";
import { DatasetLink } from "../datasets/dataset.js";
import { documents } from "./index.js";


const model = immutable({

	id: {},
	label: {},
	comment: {},

	university: { altLabel: {} }

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
		query,
		onChange: setQuery
	});

	const keywords = useKeywords(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const type = useTally(collection, "type", { label: "label", size: TallyOptions });
	const audience = useTally(collection, "audience", { label: "label", size: TallyOptions });
	const subject = useTally(collection, "subject", { label: "label", size: TallyOptions });
	const language = useTally(collection, "language", { size: TallyOptions });
	const license = useTally(collection, "license", { label: "label", size: TallyOptions });
	const count = useCount(collection);

	const members = useMembers(collection, { model });

	useEffect(() => router({ title: documents.label }), []);


	return <Page

		head={documents.label}
		menu={<DatasetLink href={documents.route}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} compact={false} tally={university}/>
			<Tally name={"Type"} compact tally={type}/>
			<Tally name={"Audience"} compact tally={audience}/>
			<Tally name={"Topic"} compact tally={subject}/>
			<Tally name={"Language"} compact tally={language}>{({ label }) => nameTag(label, navigator.language)}</Tally>
			<Tally name={"License"} compact tally={license}/>

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

				title={<Link href={id}>{label}</Link>}
				tags={university?.altLabel ?? "EC2U Alliance"}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
