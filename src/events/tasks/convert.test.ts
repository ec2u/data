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


// a publisher names the university its events are attributed to, and the zone is recovered from that

const coimbra = { id: "https://example.org/coimbra", university: `${universities.id}/coimbra` }; // UTC+1 / UTC+0
const pavia = { id: "https://example.org/pavia", university: `${universities.id}/pavia` }; // UTC+2 / UTC+1


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

async function converted(dates: Object, publisher = coimbra): Promise<Object> {
	return (await pipe(
		(items([reading(dates)]))
		(convert(publisher))
		(toArray())
	))[0] as unknown as Object;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("convert", () => {

	describe("provenance", () => {

		it("references the publisher the events are drawn from", async () => {

			expect(await converted({ startDate: "2026-07-02" }))
				.toMatchObject({ publisher: coimbra.id });

		});

		it("references the university the publisher names", async () => {

			expect(await converted({ startDate: "2026-07-02" }, pavia))
				.toMatchObject({ university: pavia.university });

		});

		it("rejects a publisher naming no known university", async () => {

			await expect(converted({ startDate: "2026-07-02" }, {
				id: "https://example.org/events",
				university: `${universities.id}/atlantis`
			})).rejects.toThrow(/unknown university/);

		});

	});

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

		it("drops an event whose wall time cannot be read", async () => {

			expect(await converted({ startDate: "2026-13-45", startTime: "13:00:00" }))
				.toBeUndefined();

		});

		it("carries an overflowing date over into the month that follows", async () => {

			expect(await converted({ startDate: "2026-02-30", startTime: "13:00:00" }))
				.toMatchObject({ startDate: "2026-02-30T13:00:00+00:00" }); // read as 2026-03-02, still winter

		});

	});

});
