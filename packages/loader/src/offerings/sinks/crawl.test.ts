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

import { umea } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import { fingerprint } from "./crawl.js";
import type { ProgramDraft } from "./sync.js";


const seed: ProgramDraft = { kind: "program", university: umea, key: "https://www.umu.se/p/", name: {} };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("fingerprint", () => {

	it("matches the same page and seed", async () => {
		expect(fingerprint(seed, "# Page")).toBe(fingerprint(seed, "# Page"));
	});

	it("tells a changed page apart", async () => {
		expect(fingerprint(seed, "# Page")).not.toBe(fingerprint(seed, "# Changed"));
	});

	it("tells a changed seed apart", async () => {
		expect(fingerprint(seed, "# Page")).not.toBe(fingerprint({ ...seed, year: "2026/2027" }, "# Page"));
	});

});
