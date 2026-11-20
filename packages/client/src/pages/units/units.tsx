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

import { Units } from "@ec2u/data-shared/units/index.js";
import { Button } from "@metreeca/clay-widgets/button";
import { Card } from "@metreeca/clay-widgets/card";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { More } from "@metreeca/clay-widgets/more";
import { Pill } from "@metreeca/clay-widgets/pill";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { Clear } from "@metreeca/tile-widgets/clear";
import { Facets } from "@metreeca/tile-widgets/facets";
import { Search } from "@metreeca/tile-widgets/search";
import { Tally } from "@metreeca/tile-widgets/tally";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useSearch } from "@metreeca/tile/search";
import { useTally } from "@metreeca/tile/tally";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { DatasetLinks } from "../../widgets/datasets/dataset.js";
import { color } from "../../widgets/datasets/links.js";
import { Size } from "../../widgets/datasets/size.js";
import { Failure } from "../../widgets/failure.js";
import { Feedback } from "../../widgets/feedback.js";
import { Page } from "../../widgets/page.js";
import { units } from "./index.js";


export function UnitsPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({

		entry: route,
		shape: Units,
		field: "resources",

		query,

		onChange: setQuery

	});

	const search = useSearch(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const classification = useTally(collection, "classification", { label: "label", size: TallyOptions });
	const subject = useTally(collection, "subject", { label: "label", size: TallyOptions });

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},

			university: { id: {}, altLabel: {} }

		},

		order: { label: "asc" }

	});


	useEffect(() => router({ title: units.label }), []);


	return <Page

		gist={query}

		head={<Size label={units.label} collection={collection}/>}
		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<Facets>

			<Search name={"Name"} search={search}/>

			<Tally name={"University"} tally={university}/>
			<Tally name={"Type"} collapsed tally={classification}/>
			<Tally name={"Topic"} collapsed tally={subject}/>

		</Facets>}

		more={<Feedback ai/>}

		meta={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty look={"subtle"}><units.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><units.glyph/></Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty><units.glyph/></Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id} lines={3}

				title={<Link href={id}>{label}</Link>}
				badge={<Pill color={color(university?.id)}>{university?.altLabel ?? "EC2U Alliance"}</Pill>}
				image={comment && <Empty><units.glyph/></Empty>}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
