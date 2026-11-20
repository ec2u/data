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
import { Button } from "@metreeca/clay-widgets/button";
import { Card } from "@metreeca/clay-widgets/card";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { More } from "@metreeca/clay-widgets/more";
import { Pill } from "@metreeca/clay-widgets/pill";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { Clear } from "@metreeca/tile-widgets/clear";
import { Facets } from "@metreeca/tile-widgets/facets";
import { Search } from "@metreeca/tile-widgets/search";
import { Tally } from "@metreeca/tile-widgets/tally";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useSearch } from "@metreeca/tile/search";
import { useTally } from "@metreeca/tile/tally";
import { duration } from "@metreeca/tile/types/duration";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { DatasetLinks } from "../../widgets/datasets/dataset.js";
import { color } from "../../widgets/datasets/links.js";
import { Size } from "../../widgets/datasets/size.js";
import { Failure } from "../../widgets/failure.js";
import { Feedback } from "../../widgets/feedback.js";
import { Page } from "../../widgets/page.js";
import { programs } from "./index.js";


export function ProgramsPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({

		entry: route,
		shape: Programs,
		field: "resources",

		query,

		onChange: setQuery

	});

	const search = useSearch(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const educationalLevel = useTally(collection, "educationalLevel", { label: "label", size: TallyOptions });
	const timeToComplete = useTally(collection, "timeToComplete", { size: TallyOptions });
	const about = useTally(collection, "about", { label: "label", size: TallyOptions });
	const provider = useTally(collection, "provider", { label: "label", size: TallyOptions });

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},

			university: { id: {}, altLabel: {} }

		},

		order: { label: "asc" }

	});


	useEffect(() => router({ title: programs.label }), []);


	return <Page

		gist={query}

		head={<Size label={programs.label} collection={collection}/>}
		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<Facets>

			<Search name={"Name"} search={search}/>

			<Tally name={"University"} tally={university}/>
			<Tally name={"Level"} collapsed tally={educationalLevel}/>
			<Tally name={"Duration"} collapsed tally={timeToComplete}>{({ label }) => duration.format(label)}</Tally>
			<Tally name={"Subjects"} collapsed tally={about}/>
			<Tally name={"Provider"} collapsed tally={provider}/>

		</Facets>}

		more={<Feedback ai/>}

		meta={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty look={"subtle"}><programs.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><programs.glyph/></Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty><programs.glyph/></Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id} lines={3}

				title={<Link href={id}>{label}</Link>}
				badge={opt(university?.altLabel, label => <Pill color={color(university?.id)}>{label}</Pill>)}
				image={comment && <Empty><programs.glyph/></Empty>}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
