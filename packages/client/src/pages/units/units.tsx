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
import { useEffect } from "preact/hooks";
import { Search } from "../../_/search.js";
import { TallyOptions } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { DatasetToggle } from "../datasets/dataset.js";
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

	const keywords = useKeywords(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const classification = useTally(collection, "classification", { label: "label", size: TallyOptions });
	const subject = useTally(collection, "subject", { label: "label", size: TallyOptions });
	const count = useCount(collection);

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			comment: {},

			university: { altLabel: {} }

		}

	});


	useEffect(() => router({ title: units.label }), []);


	return <Page

		head={units.label}
		menu={<DatasetToggle/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} compact={false} tally={university}/>
			<Tally name={"Type"} compact tally={classification}/>
			<Tally name={"Topic"} compact tally={subject}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Empty>{units.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{units.glyph}</Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty>{units.glyph}</Empty> : <>

			{state.map(({ id, label, comment, university }) => <Card key={id}

				title={<Link href={id}>{label}</Link>}
				badge={university?.altLabel ?? "EC2U Alliance"}

			>{comment}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
