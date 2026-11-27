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
import { Button } from "@grafctory/clay-widgets/button";
import { Card } from "@grafctory/clay-widgets/card";
import { Empty } from "@grafctory/clay-widgets/empty";
import { Icon } from "@grafctory/clay-widgets/icon";
import { Image } from "@grafctory/clay-widgets/image";
import { Link } from "@grafctory/clay-widgets/link";
import { More } from "@grafctory/clay-widgets/more";
import { Pill } from "@grafctory/clay-widgets/pill";
import { useRoute, useRouter } from "@grafctory/clay/router";
import { opt } from "@grafctory/core";
import { Clear } from "@grafctory/tile-widgets/clear";
import { Facets } from "@grafctory/tile-widgets/facets";
import { Range } from "@grafctory/tile-widgets/range";
import { Search } from "@grafctory/tile-widgets/search";
import { Tally } from "@grafctory/tile-widgets/tally";
import { useCollection } from "@grafctory/tile/collection";
import { useMembers } from "@grafctory/tile/members";
import { useQuery } from "@grafctory/tile/query";
import { useRange } from "@grafctory/tile/range";
import { useSearch } from "@grafctory/tile/search";
import { useTally } from "@grafctory/tile/tally";
import { date } from "@grafctory/tile/types/date";
import { instant } from "@grafctory/tile/types/instant";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { DatasetLinks } from "../../widgets/datasets/dataset.js";
import { color } from "../../widgets/datasets/links.js";
import { Size } from "../../widgets/datasets/size.js";
import { Failure } from "../../widgets/failure.js";
import { Feedback } from "../../widgets/feedback.js";
import { Page } from "../../widgets/page.js";
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

	const search = useSearch(collection, "label");
	const university = useTally(collection, "university", { label: "altLabel", size: TallyOptions });
	const startDate = useRange(collection, "startDate");
	const isAccessibleForFree = useTally(collection, "isAccessibleForFree", { size: TallyOptions });
	const eventAttendanceMode = useTally(collection, "eventAttendanceMode", { size: TallyOptions });
	const topics = useTally(collection, "keywords", { label: "label", size: TallyOptions });

	const members = useMembers(collection, {

		model: {

			id: {},
			label: {},
			disambiguatingDescription: {}, // the summary events state in place of a comment

			startDate: {},
			endDate: {},

			image: { url: {} },
			university: { id: {}, altLabel: {} }

		},

		order: { startDate: "asc", label: "asc" }

	});


	useEffect(() => router({ title: events.label }), []);


	return <Page

		gist={query}

		head={<Size label={events.label} collection={collection}/>}

		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<Facets>

			<Search name={"Title"} search={search}/>

			<Tally name={"University"} tally={university}/>
			<Range name={"Date"} collapsed type={instant.as(date)} range={startDate}/>
			<Tally name={"Free"} collapsed tally={isAccessibleForFree}>{({ label }) => label === "true" ? "Yes" : "No"}</Tally>
			<Tally name={"Attendance"} collapsed tally={eventAttendanceMode}>{({ label }) => toEventAttendanceMode(label)}</Tally>
			<Tally name={"Topic"} collapsed tally={topics}/>

		</Facets>}

		meta={<Clear collection={collection}/>}

		more={<Feedback ai/>}

	>{members({

		blank: () => <Empty look={"subtle"}><events.glyph/></Empty>,
		error: ({ state }) => <Failure problem={state}><Empty><events.glyph/></Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty><events.glyph/></Empty> : <>

			{state.map(({ id, label, disambiguatingDescription, startDate, endDate, image, university }) =>
				<Card key={id} lines={3}

					title={<Link href={id}>{`${schedule(startDate, endDate)} / ${label}`}</Link>}
					badge={opt(university?.altLabel, label => <Pill color={color(university?.id)}>{label}</Pill>)}
					image={opt(image, ({ url }) => <Image src={url[0]}/>)
						?? (disambiguatingDescription && <Empty><events.glyph/></Empty>)}

				>{disambiguatingDescription}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
