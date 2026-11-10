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
import { useRoute, useRouter } from "@metreeca/clay/router";
import { Clear } from "@metreeca/tile-widgets/filters/clear";
import { Tally } from "@metreeca/tile-widgets/filters/tally";
import { Count } from "@metreeca/tile-widgets/viewers/count";
import { useCollection } from "@metreeca/tile/collection";
import { useCount } from "@metreeca/tile/count";
import { useKeywords } from "@metreeca/tile/keywords";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useTally } from "@metreeca/tile/tally";
import { duration } from "@metreeca/tile/types/duration";
import { useEffect } from "preact/hooks";
import { Search } from "../../_/search.js";
import { TallyOptions } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { DatasetToggle } from "../datasets/dataset.js";
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

	const keywords = useKeywords(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const educationalLevel = useTally(collection, "educationalLevel", { label: "label", size: TallyOptions });
	const timeToComplete = useTally(collection, "timeToComplete", { size: TallyOptions });
	const about = useTally(collection, "about", { label: "label", size: TallyOptions });
	const provider = useTally(collection, "provider", { label: "label", size: TallyOptions });
	const count = useCount(collection);

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},

			university: { altLabel: {} }

		}

	});


	useEffect(() => router({ title: programs.label }), []);


	return <Page

		head={programs.label}
		menu={<DatasetToggle/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} compact={false} tally={university}/>
			<Tally name={"Level"} compact tally={educationalLevel}/>
			<Tally name={"Duration"} compact tally={timeToComplete}>{({ label }) => duration.format(label)}</Tally>
			<Tally name={"Subjects"} compact tally={about}/>
			<Tally name={"Provider"} compact tally={provider}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Empty>{programs.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{programs.glyph}</Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty>{programs.glyph}</Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id}

				title={<Link href={id}>{label}</Link>}
				badge={university?.altLabel}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
