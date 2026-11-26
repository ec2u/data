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

import { pipe } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { toArray } from "@grafctory/flow/sinks";
import { html } from "@grafctory/mime-xml";
import { type AnyNode, type Element } from "domhandler";
import { findAll } from "domutils";
import { describe, expect, it } from "vitest";
import { unbust } from "./umea.js";


async function page(src: string, base?: string): Promise<AnyNode> {

	const [tree] = await pipe(
		(items([`<html><body><main><h1>Group</h1><img alt="Funder" src="${src}"></main></body></html>`]))
		(html(base))
		(toArray())
	);

	return tree ?? expect.unreachable("parsed no page");

}

function sources(tree: AnyNode): readonly string[] {
	return findAll((element: Element) => element.name === "img", [tree]).map(image => image.attribs["src"] ?? "");
}


describe("unbust", () => {

	it("drops the version a known site rotates on image addresses", async () => {

		expect(sources(unbust(await page(
			"https://www.umu.se/contentassets/97ee/vetenskapsradet_logo_sv.png?v=%E2%88%92691816618&width=150&quality=90"
		)))).toEqual([
			"https://www.umu.se/contentassets/97ee/vetenskapsradet_logo_sv.png?width=150&quality=90"
		]);

	});

	it("yields the same addresses whatever version a known site states", async () => {

		expect(sources(unbust(await page("https://www.umu.se/contentassets/97ee/logo.png?v=1441280997"))))
			.toEqual(sources(unbust(await page("https://www.umu.se/contentassets/97ee/logo.png?v=%E2%88%92468651020"))));

	});

	it("drops the version on relative image addresses of a page of a known site", async () => {

		expect(sources(unbust(await page(
			"/contentassets/97ee/vetenskapsradet_logo_sv.png?v=%E2%88%921421630791&width=150&quality=90",
			"https://www.umu.se/forskning/grupper/air/"
		)))).toEqual([
			"https://www.umu.se/contentassets/97ee/vetenskapsradet_logo_sv.png?width=150&quality=90"
		]);

	});

	it("keeps the version on relative image addresses of a page of another site", async () => {

		expect(sources(unbust(await page("/photo.jpg?v=64322406", "https://example.org/a/"))))
			.toEqual(["/photo.jpg?v=64322406"]);

	});

	it("keeps the version on image addresses of other sites", async () => {

		expect(sources(unbust(await page("https://example.org/photo.jpg?v=64322406"))))
			.toEqual(["https://example.org/photo.jpg?v=64322406"]);

	});

	it("leaves the input tree as it stands", async () => {

		const tree = await page("https://www.umu.se/contentassets/97ee/logo.png?v=1441280997");

		unbust(tree);

		expect(sources(tree)).toEqual(["https://www.umu.se/contentassets/97ee/logo.png?v=1441280997"]);

	});

});
