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
import { Button } from "@grafctory/clay-widgets/button";
import { Card } from "@grafctory/clay-widgets/card";
import { Empty } from "@grafctory/clay-widgets/empty";
import { Icon } from "@grafctory/clay-widgets/icon";
import { Link } from "@grafctory/clay-widgets/link";
import { More } from "@grafctory/clay-widgets/more";
import { Pill } from "@grafctory/clay-widgets/pill";
import { useRoute, useRouter } from "@grafctory/clay/router";
import { nameTag } from "@grafctory/core/language";
import { Clear } from "@grafctory/tile-widgets/clear";
import { Facets } from "@grafctory/tile-widgets/facets";
import { Search } from "@grafctory/tile-widgets/search";
import { Tally } from "@grafctory/tile-widgets/tally";
import { useCollection } from "@grafctory/tile/collection";
import { useMembers } from "@grafctory/tile/members";
import { useQuery } from "@grafctory/tile/query";
import { useSearch } from "@grafctory/tile/search";
import { useTally } from "@grafctory/tile/tally";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { DatasetLinks } from "../../widgets/datasets/dataset.js";
import { color } from "../../widgets/datasets/links.js";
import { Size } from "../../widgets/datasets/size.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { documents } from "./index.js";


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

	const search = useSearch(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const type = useTally(collection, "type", { label: "label", size: TallyOptions });
	const audience = useTally(collection, "audience", { label: "label", size: TallyOptions });
	const subject = useTally(collection, "subject", { label: "label", size: TallyOptions });
	const language = useTally(collection, "language", { size: TallyOptions });
	const license = useTally(collection, "license", { label: "label", size: TallyOptions });

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},

			university: { id: {}, altLabel: {} }

		},

		order: { label: "asc" }

	});


	useEffect(() => router({ title: documents.label }), []);


	return <Page

		gist={query}

		head={<Size label={documents.label} collection={collection}/>}
		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<Facets>

			<Search name={"Name"} search={search}/>

			<Tally name={"University"} tally={university}/>
			<Tally name={"Type"} collapsed tally={type}/>
			<Tally name={"Audience"} collapsed tally={audience}/>
			<Tally name={"Topic"} collapsed tally={subject}/>
			<Tally name={"Language"} collapsed tally={language}>{({ label }) => nameTag(label, navigator.language)}</Tally>
			<Tally name={"License"} collapsed tally={license}/>

		</Facets>}

		meta={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty look={"subtle"}><documents.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><documents.glyph/></Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty><documents.glyph/></Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id} lines={3}

				title={<Link href={id}>{label}</Link>}
				badge={<Pill color={color(university?.id)}>{university?.altLabel ?? "EC2U Alliance"}</Pill>}
				image={comment && <Empty><documents.glyph/></Empty>}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
