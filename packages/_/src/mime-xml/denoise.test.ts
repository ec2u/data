/*
 * Copyright © 2026 Metreeca srl
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

import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { html, untag } from "@metreeca/mime-xml";
import { Document, Text } from "domhandler";
import { describe, expect, it } from "vitest";
import { cfemail, denoise } from "./denoise.js";


/**
 * The payload Cloudflare encodes `alpha@example.com` into on one request.
 */
const Alpha = "42232e322a2302273a232f322e276c212d2f";

/**
 * The payload Cloudflare encodes `alpha@example.com` into on another request.
 */
const AlphaAgain = "7a1b160a121b3a1f021b170a161f54191517";

/**
 * The payload Cloudflare encodes `zoë@example.com` into.
 */
const Zoe = "176d78d4bc57726f767a677b723974787a";


/**
 * Parses a page as HTML, recording `base` as its base URL.
 */
async function page(markup: string, base?: string): Promise<Document> {

	const [document] = await pipe((items([markup]))(html(base))(toArray()));

	return document!; // ;(cast) a page holding markup always parses into a document

}

/**
 * Renders a page as Markdown.
 */
async function rendered(document: Document): Promise<string> {

	const [markdown] = await pipe((items([document]))(untag())(toArray()));

	return markdown!; // ;(cast) the renderer emits one rendering for each page it is fed

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("cfemail", () => {

	describe("obfuscated text", () => {

		it("replaces a marked element with the address", async () => {

			expect(await rendered(cfemail(await page(
				`<p>write to <span class="__cf_email__" data-cfemail="${Alpha}">[email&#160;protected]</span></p>`
			)))).toBe("write to alpha@example.com");

		});

		it("matches the marker among other classes", async () => {

			expect(await rendered(cfemail(await page(
				`<p><span class="link __cf_email__ mail" data-cfemail="${Alpha}">[email&#160;protected]</span></p>`
			)))).toBe("alpha@example.com");

		});

		it("decodes addresses outside the ASCII range", async () => {

			expect(await rendered(cfemail(await page(
				`<p><span class="__cf_email__" data-cfemail="${Zoe}">[email&#160;protected]</span></p>`
			)))).toBe("zoë@example.com");

		});

	});

	describe("obfuscated links", () => {

		it("retargets a relative protection link to the address", async () => {

			expect(await rendered(cfemail(await page(
				`<p><a href="/cdn-cgi/l/email-protection#${Alpha}">mail us</a></p>`
			)))).toBe("[mail us](mailto:alpha@example.com)");

		});

		it("retargets an absolute protection link to the address", async () => {

			expect(await rendered(cfemail(await page(
				`<p><a href="https://example.org/cdn-cgi/l/email-protection#${Alpha}">mail us</a></p>`
			)))).toBe("[mail us](mailto:alpha@example.com)");

		});

		it("restores both target and label of a link wrapping obfuscated text", async () => {

			expect(await rendered(cfemail(await page(`<p><a href="/cdn-cgi/l/email-protection#${Alpha}">`
				+ `<span class="__cf_email__" data-cfemail="${AlphaAgain}">[email&#160;protected]</span>`
				+ `</a></p>`
			)))).toBe("[alpha@example.com](mailto:alpha@example.com)");

		});

		it("leaves other links as they stand", async () => {

			expect(await rendered(cfemail(await page(
				`<p><a href="/contacts#${Alpha}">contacts</a></p>`
			)))).toBe(`[contacts](/contacts#${Alpha})`);

		});

	});

	describe("stability", () => {

		it("yields the same rendering whatever key the payload is encoded under", async () => {

			expect(await rendered(cfemail(await page(
				`<p><a href="/cdn-cgi/l/email-protection#${Alpha}">mail us</a></p>`
			)))).toBe(await rendered(cfemail(await page(
				`<p><a href="/cdn-cgi/l/email-protection#${AlphaAgain}">mail us</a></p>`
			))));

		});

	});

	describe("malformed payloads", () => {

		it("leaves a marked element with an undecodable payload as it stands", async () => {

			expect(await rendered(cfemail(await page(
				`<p><span class="__cf_email__" data-cfemail="4z">[email&#160;protected]</span></p>`
			)))).toBe("[email protected]");

		});

		it("leaves a protection link with an undecodable payload as it stands", async () => {

			expect(await rendered(cfemail(await page(
				`<p><a href="/cdn-cgi/l/email-protection#4">mail us</a></p>`
			)))).toBe("[mail us](/cdn-cgi/l/email-protection#4)");

		});

	});

	describe("tree handling", () => {

		it("leaves the input tree untouched", async () => {

			const document = await page(`<p><span class="__cf_email__" data-cfemail="${Alpha}">[email&#160;protected]</span>`
				+ ` <a href="/cdn-cgi/l/email-protection#${Alpha}">mail us</a></p>`
			);

			const before = await rendered(document);

			cfemail(document);

			expect(await rendered(document)).toBe(before);

		});

		it("returns a tree carrying no obfuscated address as it stands", async () => {

			const document = await page(`<p>alpha <a href="/beta">beta</a></p>`);

			expect(cfemail(document)).toBe(document);

		});

		it("keeps the base URL of the page", async () => {

			expect(await rendered(cfemail(await page(
				`<p><a href="/cdn-cgi/l/email-protection#${Alpha}">mail us</a></p>`,
				"https://example.com/a/b"
			)))).toBe(`---\nurl: "https://example.com/a/b"\n---\n\n[mail us](mailto:alpha@example.com)`);

		});

	});

});


describe("denoise", () => {

	/**
	 * Runs a page through a denoiser, rendering the result.
	 */
	async function denoised(markup: string, ...rules: readonly ((document: Document) => Document)[]): Promise<string> {

		const [document] = await pipe((items([await page(markup)]))(denoise(...rules))(toArray()));

		return rendered(document!); // ;(cast) the denoiser emits one page for each page it is fed

	}

	/**
	 * A rule appending a marker paragraph to a page, leaving the input tree untouched.
	 */
	function marker(label: string): (document: Document) => Document {
		return document => new Document([...document.children.map(child => child.cloneNode(true)), new Text(label)]);
	}


	it("applies the default rules", async () => {

		expect(await denoised(`<p><span class="__cf_email__" data-cfemail="${Alpha}">[email&#160;protected]</span></p>`))
			.toBe("alpha@example.com");

	});

	it("applies extra rules after the defaults, in the order given", async () => {

		expect(await denoised(
			`<p><span class="__cf_email__" data-cfemail="${Alpha}">[email&#160;protected]</span></p>`,
			marker(" beta"),
			marker(" gamma")
		)).toBe("alpha@example.com\n\nbeta gamma");

	});

	it("emits one page for each page it is fed", async () => {

		expect(await pipe(
			(items([await page(`<p>alpha</p>`), await page(`<p>beta</p>`)]))
			(denoise())
			(toArray())
		)).toHaveLength(2);

	});

});
