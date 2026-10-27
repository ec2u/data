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

import { describe, expect, it } from "vitest";
import { events, getEventId, isStaleEvent } from "./index.js";


const url = "https://example.org/events/1";


function stamp(offset: number): string {

	const now = new Date();
	const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()+offset));

	return day.toISOString();

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("isStaleEvent", () => {

	it("reads an event ended before the current day as stale", () => {
		expect(isStaleEvent({ startDate: stamp(-1) })).toBe(true);
	});

	it("leaves an event running today in place", () => {
		expect(isStaleEvent({ startDate: stamp(0) })).toBe(false);
	});

	it("leaves an event still to come in place", () => {
		expect(isStaleEvent({ startDate: stamp(1) })).toBe(false);
	});

	it("weighs an event by its end rather than its start", () => {
		expect(isStaleEvent({ startDate: stamp(-10), endDate: stamp(1) })).toBe(false);
		expect(isStaleEvent({ startDate: stamp(-10), endDate: stamp(-1) })).toBe(true);
	});

});


describe("getEventId", () => {

	it("names the same event for the same address", () => {
		expect(getEventId(url)).toBe(getEventId(url));
	});

	it("names a different event for a different address", () => {
		expect(getEventId(url)).not.toBe(getEventId(`${url}/2`));
	});

	it("names the event as a direct member of the events catalogue", () => {
		expect(getEventId(url)).toMatch(new RegExp(`^${events.id}[^/]+$`));
	});

});
