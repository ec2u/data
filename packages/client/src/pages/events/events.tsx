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
import { Button } from "@metreeca/clay-widgets/button";
import { Card } from "@metreeca/clay-widgets/card";
import { Empty } from "@metreeca/clay-widgets/empty";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Image } from "@metreeca/clay-widgets/image";
import { Link } from "@metreeca/clay-widgets/link";
import { More } from "@metreeca/clay-widgets/more";
import { useRoute, useRouter } from "@metreeca/clay/router";
import { opt } from "@metreeca/core";
import { Clear } from "@metreeca/tile-widgets/filters/clear";
import { Range } from "@metreeca/tile-widgets/filters/range";
import { Search } from "@metreeca/tile-widgets/filters/search";
import { Tally } from "@metreeca/tile-widgets/filters/tally";
import { useCollection } from "@metreeca/tile/collection";
import { useMembers } from "@metreeca/tile/members";
import { useQuery } from "@metreeca/tile/query";
import { useRange } from "@metreeca/tile/range";
import { useSearch } from "@metreeca/tile/search";
import { useTally } from "@metreeca/tile/tally";
import { date } from "@metreeca/tile/types/date";
import { instant } from "@metreeca/tile/types/instant";
import { useEffect } from "preact/hooks";
import { TallyOptions } from "../../index.core.js";
import { Failure } from "../../widgets/failure.js";
import { Page } from "../../widgets/page.js";
import { Size } from "../../widgets/size.js";
import { DatasetLinks } from "../datasets/dataset.js";
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
			university: { altLabel: {} }

		},

		order: { startDate: "asc", label: "asc" }

	});


	useEffect(() => router({ title: events.label }), []);


	return <Page

		head={<Size label={events.label} collection={collection}/>}
		menu={members({

			error: ({ reload }) => <Button icon={<Icon.Reload/>} title={"Reload"} onClick={reload}/>

		}, <DatasetLinks/>)}

		tray={<>

			<Search name={"Name"} search={search}/>

			<Tally name={"University"} tally={university}/>
			<Range name={"Date"} collapsed type={instant.as(date)} range={startDate}/>
			<Tally name={"Free"} collapsed tally={isAccessibleForFree}>{({ label }) => label === "true" ? "Yes" : "No"}</Tally>
			<Tally name={"Attendance"} collapsed tally={eventAttendanceMode}>{({ label }) => toEventAttendanceMode(label)}</Tally>
			<Tally name={"Topic"} collapsed tally={topics}/>

		</>}

		meta={<Clear collection={collection}/>}

	>{members({

		blank: () => <Empty look={"subtle"}>{events.glyph}</Empty>,
		error: ({ state }) => <Failure problem={state}><Empty>{events.glyph}</Empty></Failure>,

		ready: ({ state, load }) => state.length === 0 ? <Empty>{events.glyph}</Empty> : <>

			{state.map(({ id, label, disambiguatingDescription, startDate, endDate, image, university }) =>
				<Card key={id}

					title={<Link href={id}>{`${schedule(startDate, endDate)} / ${label}`}</Link>}
					badge={university?.altLabel}
					image={opt(image, ({ url }) => <Image src={url[0]}/>)}

				>{disambiguatingDescription}</Card>)}

			{load && <More onLoad={load}/>}

		</>

	})}</Page>;

}
