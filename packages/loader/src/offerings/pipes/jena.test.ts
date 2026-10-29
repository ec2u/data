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

import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { jena } from "@ec2u/data-shared/universities/index.core.js";
import { describe, expect, it } from "vitest";
import { program } from "./jena.js";


const url = "https://www.uni-jena.de/en/6120/b-a-min-ancient-history";

const page = {
	"@context": "https://schema.org",
	"@type": "AboutPage",
	"headline": "Ancient History",
	"abstract": "What did a Roman emperor actually do?",
	"url": url,
	"inLanguage": "en-GB",
	"educationalLevel": "Master of Science"
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("program", () => {

	it("reads the facts the page states", async () => {
		expect(program([page], url)).toEqual({
			kind: "program",
			university: jena,
			key: url,
			name: { en: "Ancient History" },
			description: { en: "What did a Roman emperor actually do?" },
			url: [url],
			educationalLevel: [getTopicId(isced2011, "7")],
			educationalCredentialAwarded: { credentialCategory: "Degree", name: { en: "Master of Science" } }
		});
	});

	it("maps known degrees to ISCED 2011 levels", async () => {

		const level = (educationalLevel: string) => program([{ ...page, educationalLevel }], url)?.educationalLevel;

		expect(level("Bachelor of Arts")).toEqual([getTopicId(isced2011, "6")]);
		expect(level("Master of Education")).toEqual([getTopicId(isced2011, "7")]);
		expect(level("state examination")).toEqual([getTopicId(isced2011, "9")]);
		expect(level("Certificate")).toEqual([]);

	});

	it("states no degree where the page names none", async () => {

		const read = program([{ ...page, educationalLevel: null }], url);

		expect(read).not.toHaveProperty("educationalCredentialAwarded");
		expect(read).toMatchObject({ educationalLevel: [] });

	});

	it("keys the program by the address the catalogue links", async () => {
		expect(program([{ ...page, url: "https://www.uni-jena.de/en/other" }], url)).toMatchObject({ key: url, url: [url] });
	});

	it("reads texts in the language the page states", async () => {
		expect(program([{ ...page, inLanguage: "de-DE" }], url)).toMatchObject({ name: { de: "Ancient History" } });
	});

	it("picks the AboutPage among the embedded values", async () => {
		expect(program([{ "@type": "Organization", "name": "Uni" }, page], url)).toMatchObject({
			name: { en: "Ancient History" }
		});
	});

	it("reads nothing without an AboutPage stating a headline", async () => {
		expect(program([{ ...page, "@type": "WebPage" }], url)).toBeUndefined();
		expect(program([{ ...page, headline: " " }], url)).toBeUndefined();
		expect(program([], url)).toBeUndefined();
	});

});
