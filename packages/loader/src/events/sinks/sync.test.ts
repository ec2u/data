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
import { isPending } from "./sync.js";


describe("isPending()", () => {

	const today = "2026-11-24";

	describe("unknown pages", () => {

		it("reads a page never stored", async () => {
			expect(isPending(undefined, "a", today)).toBe(true);
		});

	});

	describe("current pages", () => {

		it("skips a page whose document is unchanged", async () => {
			expect(isPending({ digest: "a", fetched: "2026-11-01", crawled: "2026-11-01" }, "a", today)).toBe(false);
		});

		it("reads a page whose document changed", async () => {
			expect(isPending({ digest: "a", fetched: "2026-11-23", crawled: "2026-11-23" }, "b", today)).toBe(true);
		});

		it("treats a page stored without dates as current", async () => {
			expect(isPending({ digest: "a" }, "a", today)).toBe(false);
			expect(isPending({ digest: "a" }, "b", today)).toBe(true);
		});

	});

	describe("failing pages", () => {

		it("reads a page again the day after a failure following a recent success", async () => {
			expect(isPending({ digest: "a", fetched: "2026-11-23", crawled: "2026-11-22" }, "a", today)).toBe(true);
		});

		it("waits as many days as the failure has lasted", async () => {
			expect(isPending({ digest: "a", fetched: "2026-11-21", crawled: "2026-11-17" }, "a", today)).toBe(false);
			expect(isPending({ digest: "a", fetched: "2026-11-20", crawled: "2026-11-16" }, "a", today)).toBe(true);
		});

		it("waits at most 7 days", async () => {
			expect(isPending({ digest: "a", fetched: "2026-11-18", crawled: "2026-10-01" }, "a", today)).toBe(false);
			expect(isPending({ digest: "a", fetched: "2026-11-17", crawled: "2026-10-01" }, "a", today)).toBe(true);
		});

		it("waits 7 days for a page that never succeeded", async () => {
			expect(isPending({ digest: "a", fetched: "2026-11-18" }, "a", today)).toBe(false);
			expect(isPending({ digest: "a", fetched: "2026-11-17" }, "a", today)).toBe(true);
		});

		it("waits whether or not the document changed", async () => {
			expect(isPending({ digest: "a", fetched: "2026-11-23" }, "b", today)).toBe(false);
		});

	});

});
