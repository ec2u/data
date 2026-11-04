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

import { Events } from "@ec2u/data-shared/events/index.js";
import { opt } from "@metreeca/core";
import { Button } from "@metreeca/tile-cell/button";
import { Hint } from "@metreeca/tile-cell/hint";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { More } from "@metreeca/tile-cell/more";
import { useRoute, useRouter } from "@metreeca/tile-data/router";
import {
	useCollection,
	useCount,
	useKeywords,
	useMembers,
	useQuery,
	useRange,
	useTally
} from "@metreeca/tile-data/store";
import { Card } from "@metreeca/tile-hive/card";
import { Clear } from "@metreeca/tile-lens/clear";
import { Count } from "@metreeca/tile-lens/count";
import { Range } from "@metreeca/tile-lens/range";
import { Tally } from "@metreeca/tile-lens/tally";
import { date } from "@metreeca/tile-type/date";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { Failure } from "../../tiles/failure.js";
import { Page } from "../../tiles/page.js";
import { Search } from "../../_/search.js";
import { DatasetLink } from "../datasets/dataset.js";
import { schedule } from "./event.js";
import { toEventAttendanceMode } from "./index.core.js";
import { events } from "./index.js";


export function EventsPage() {

	const route = useRoute();
	const router = useRouter();

	const [query, setQuery] = useQuery();

	const collection = useCollection({

		entry: route,
		shape: Events,
		field: "resources",

		query,

		onChange: setQuery

	});

	const keywords = useKeywords(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const startDate = useRange(collection, "startDate");
	const isAccessibleForFree = useTally(collection, "isAccessibleForFree", { size: TallyOptions });
	const eventAttendanceMode = useTally(collection, "eventAttendanceMode", { size: TallyOptions });
	const topics = useTally(collection, "keywords", { label: "label", size: TallyOptions });
	const count = useCount(collection);

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			disambiguatingDescription: {}, // the summary events state in place of a comment

			startDate: {},
			endDate: {},

			image: { url: {} },
			university: { altLabel: {} }

		},

		order: { startDate: "asc", label: "asc" }

	});


	useEffect(() => router({ title: events.label }), []);


	return <Page

		head={events.label}
		menu={<DatasetLink href={events.route}/>}

		back={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		})}

		tray={<>

			<Search placeholder={"Name"} value={keywords.text} onChange={keywords.search}/>

			<Tally name={"University"} compact={false} tally={university}/>
			<Range name={"Date"} compact type={date({ instant: true })} range={startDate}/>
			<Tally name={"Free"} compact tally={isAccessibleForFree}>{({ label }) => label === "true" ? "Yes" : "No"}</Tally>
			<Tally name={"Attendance"} compact tally={eventAttendanceMode}>{({ label }) => toEventAttendanceMode(label)}</Tally>
			<Tally name={"Topic"} compact tally={topics}/>

		</>}

		info={<>
			<Count collection={collection} count={count}/>
			<Clear collection={collection}/>
		</>}

	>{members({

		blank: () => <Hint>{events.glyph}</Hint>,
		error: ({ state }) => <Failure problem={state}><Hint>{events.glyph}</Hint></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Hint>{events.glyph}</Hint> : <>

			{state.map(({ id, label, disambiguatingDescription, startDate, endDate, image, university }) =>
				<Card key={id}

					title={<Link href={id}>{`${schedule(startDate, endDate)} / ${label}`}</Link>}
					tags={university?.altLabel}
					image={opt(image, ({ url }) => url[0])}

				>{disambiguatingDescription}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
