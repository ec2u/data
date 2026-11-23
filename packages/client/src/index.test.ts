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
import { pinnedScheme } from "./index.core.js";


describe("pinnedScheme()", () => {

	it("should pin the dark scheme", async () => {
		expect(pinnedScheme("?scheme=dark")).toBe("dark");
	});

	it("should pin the light scheme", async () => {
		expect(pinnedScheme("?scheme=light")).toBe("light");
	});

	it("should pin the scheme among other parameters", async () => {
		expect(pinnedScheme("?source=https%3A%2F%2Fexample.org&scheme=dark")).toBe("dark");
	});

	it("should pin nothing without a query string", async () => {
		expect(pinnedScheme("")).toBeUndefined();
	});

	it("should pin nothing without a scheme parameter", async () => {
		expect(pinnedScheme("?source=https%3A%2F%2Fexample.org")).toBeUndefined();
	});

	it("should pin nothing for an unknown scheme", async () => {
		expect(pinnedScheme("?scheme=sepia")).toBeUndefined();
	});

	it("should pin nothing for a differently cased scheme", async () => {
		expect(pinnedScheme("?scheme=Dark")).toBeUndefined();
	});

});
