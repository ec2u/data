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
import { leads } from "./umea.js";


const program = "https://www.umu.se/utbildning/program/apotekarprogrammet/";
const course = "https://www.umu.se/utbildning/kurser/3d-modellering-och-siktanalys-2kg605/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("leads", () => {

	it("keys each listed offering by its page address", async () => {
		expect(leads({ hits: [{ url: program, title: "Apotekarprogrammet" }] }, "program")).toEqual([{
			url: program,
			seed: { kind: "program", university: umea, key: program, name: {} }
		}]);
	});

	it("lists courses as courses", async () => {
		expect(leads({ hits: [{ url: course }] }, "course")).toEqual([{
			url: course,
			seed: { kind: "course", university: umea, key: course, name: {} }
		}]);
	});

	it("lists a page listed more than once once", async () => {
		expect(leads({ hits: [{ url: course }, { url: course }] }, "course")).toHaveLength(1);
	});

	it("leaves out hits with no usable web address", async () => {
		expect(leads({ hits: [{ url: null }, { url: "kurser/x/" }, { title: "x" }, null] }, "course")).toEqual([]);
	});

	it("lists nothing from a malformed response", async () => {
		expect(leads(null, "course")).toEqual([]);
		expect(leads({ hits: "none" }, "course")).toEqual([]);
	});

});
