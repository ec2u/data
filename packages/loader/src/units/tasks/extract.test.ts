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

import { pavia } from "@ec2u/data-shared/index.core.js";
import { digest } from "@grafctory/mime-json";
import { describe, expect, it } from "vitest";
import type { Page } from "../sinks/crawl.js";
import { drafted, type Reported } from "./extract.js";


const page: Page = {
	url: "https://portale.unipv.it/it/ricerca/dipartimenti/fisica",
	document: "# Dipartimento di Fisica\n\nIl dipartimento."
};

const reported: Reported = {
	name: "Dipartimento di Fisica",
	acronym: "DF",
	description: "Il dipartimento.",
	language: "it"
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("drafted", () => {

	it("drafts the unit in the language of the page", async () => {
		expect(drafted(pavia, page, reported)).toEqual({

			hash: digest(page.document),

			draft: {

				id: page.url,

				prefLabel: { it: "Dipartimento di Fisica" },
				altLabel: "DF",
				definition: { it: "Il dipartimento." },

				homepage: [page.url],
				mbox: [],

				unitOf: [],
				institutes: [],

				heads: []

			}

		});
	});

	it("falls back to the local language of the university", async () => {
		expect(drafted(pavia, page, { ...reported, language: "italian" }).draft)
			.toMatchObject({ prefLabel: { it: "Dipartimento di Fisica" } });
	});

	it("states no definition for a blank description", async () => {
		expect(drafted(pavia, page, { ...reported, description: " \n" }).draft).not.toHaveProperty("definition");
	});

});
