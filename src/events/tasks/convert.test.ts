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

import { convert } from "@/events/tasks/convert.js";
import { universities } from "@/universities/index.js";
import type { Object } from "@metreeca/core";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { describe, expect, it } from "vitest";


const coimbra = { id: `${universities.id}/coimbra`, zone: "Europe/Lisbon" }; // UTC+1 in summer, UTC+0 in winter
const pavia = { id: `${universities.id}/pavia`, zone: "Europe/Rome" }; // UTC+2 in summer, UTC+1 in winter


function reading(dates: Object): Object {
	return {

		event: true,

		url: "https://example.org/event",
		title: "Test Event",
		description: "Test description",
		language: "en",

		...dates

	};
}

async function converted(dates: Object, university = coimbra): Promise<Object> {
	return (await pipe(
		(items([reading(dates)]))
		(convert(university))
		(toArray())
	))[0] as unknown as Object;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("convert", () => {

	describe("dates", () => {

		it("anchors a wall time to the zone of the university", async () => {

			expect(await converted({ startDate: "2026-07-02", startTime: "13:00:00" }))
				.toMatchObject({ startDate: "2026-07-02T13:00:00+01:00" });

		});

		it("anchors the same wall time to each university on its own zone", async () => {

			expect(await converted({ startDate: "2026-07-02", startTime: "13:00:00" }, pavia))
				.toMatchObject({ startDate: "2026-07-02T13:00:00+02:00" });

		});

		it("reads the offset the zone keeps at that date", async () => {

			expect(await converted({ startDate: "2026-01-14", startTime: "13:00:00" }))
				.toMatchObject({ startDate: "2026-01-14T13:00:00+00:00" });

		});

		it("reads the offset the zone keeps at that wall time, across a transition", async () => {

			// Europe/Rome moves to +02:00 at 02:00 local on 2026-03-29, that is at 01:00 UTC

			expect(await converted({ startDate: "2026-03-29", startTime: "01:30:00" }, pavia))
				.toMatchObject({ startDate: "2026-03-29T01:30:00+01:00" });

			expect(await converted({ startDate: "2026-03-29", startTime: "03:30:00" }, pavia))
				.toMatchObject({ startDate: "2026-03-29T03:30:00+02:00" });

		});

		it("sets aside the fraction of a second an extraction appends", async () => {

			expect(await converted({ startDate: "2026-07-02", startTime: "13:00:00.000" }))
				.toMatchObject({ startDate: "2026-07-02T13:00:00+01:00" });

		});

		it("reads a time carrying a zone designator as the wall time it names", async () => {

			expect(await converted({ startDate: "2026-07-02", startTime: "13:00:00.000Z" }))
				.toMatchObject({ startDate: "2026-07-02T13:00:00+01:00" });

			expect(await converted({ startDate: "2026-07-02", startTime: "13:00:00-00:00" }, pavia))
				.toMatchObject({ startDate: "2026-07-02T13:00:00+02:00" });

		});

		it("reads a date carrying a zone designator as the wall date it names", async () => {

			expect(await converted({ startDate: "2026-07-02Z", startTime: "13:00:00" }))
				.toMatchObject({ startDate: "2026-07-02T13:00:00+01:00" });

		});

		it("opens an event stating no time at midnight", async () => {

			expect(await converted({ startDate: "2026-07-02" }))
				.toMatchObject({ startDate: "2026-07-02T00:00:00+01:00" });

		});

		it("states no end for an event stating neither end date nor end time", async () => {

			expect(await converted({ startDate: "2026-07-02", startTime: "13:00:00" }))
				.toMatchObject({ endDate: undefined });

		});

		it("closes an event stating an end time alone on the day it opens", async () => {

			expect(await converted({ startDate: "2026-07-02", startTime: "13:00:00", endTime: "18:30:00" }))
				.toMatchObject({ endDate: "2026-07-02T18:30:00+01:00" });

		});

		it("closes an event stating an end date alone at midnight", async () => {

			expect(await converted({ startDate: "2026-07-02", endDate: "2026-07-09" }))
				.toMatchObject({ endDate: "2026-07-09T00:00:00+01:00" });

		});

		it("leaves an unreadable wall time unanchored, for the shape to reject", async () => {

			expect(await converted({ startDate: "2026-13-45", startTime: "13:00:00" }))
				.toMatchObject({ startDate: "2026-13-45T13:00:00Z" });

		});

		it("carries an overflowing date over into the month that follows", async () => {

			expect(await converted({ startDate: "2026-02-30", startTime: "13:00:00" }))
				.toMatchObject({ startDate: "2026-02-30T13:00:00+00:00" }); // read as 2026-03-02, still winter

		});

	});

});
