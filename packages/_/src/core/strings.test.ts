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

import { describe, expect, it } from "vitest";
import { details, summary } from "./strings.js";


describe("summary()", () => {

	it("should return a single paragraph as a whole", async () => {
		expect(summary("Topics the dataset is about.")).toBe("Topics the dataset is about.");
	});

	it("should keep line breaks within the first paragraph", async () => {
		expect(summary("Topics the dataset\nis about.\n\nMore.")).toBe("Topics the dataset\nis about.");
	});

	it("should stop at the first blank line", async () => {
		expect(summary("Topics.\n\nDrawn from EuroSciVoc.\n\nMore.")).toBe("Topics.");
	});

	it("should treat lines holding only spaces as blank", async () => {
		expect(summary("Topics.\n \t\nDrawn from EuroSciVoc.")).toBe("Topics.");
	});

	it("should trim the paragraph", async () => {
		expect(summary("\n\n  Topics.  \n\nDrawn from EuroSciVoc.")).toBe("Topics.");
	});

	it("should skip a leading front matter", async () => {
		expect(summary("---\ntitle: Topics\n---\n\nTopics.\n\nMore.")).toBe("Topics.");
		expect(summary("---\ntitle: Topics\n---\nTopics.")).toBe("Topics.");
	});

	it("should skip an empty front matter", async () => {
		expect(summary("---\n---\nTopics.")).toBe("Topics.");
	});

	it("should keep an unclosed front matter fence as text", async () => {
		expect(summary("---\nTopics.")).toBe("---\nTopics.");
	});

	it("should return undefined for front matter alone", async () => {
		expect(summary("---\ntitle: Topics\n---\n")).toBeUndefined();
	});

	it("should return undefined for blank text", async () => {
		expect(summary("")).toBeUndefined();
		expect(summary(" \n\n ")).toBeUndefined();
	});

});

describe("details()", () => {

	it("should return the paragraphs following the first one", async () => {
		expect(details("Topics.\n\nDrawn from EuroSciVoc.")).toBe("Drawn from EuroSciVoc.");
	});

	it("should keep the breaks between the following paragraphs", async () => {
		expect(details("Topics.\n\nDrawn.\n\nMore.")).toBe("Drawn.\n\nMore.");
	});

	it("should treat lines holding only spaces as blank", async () => {
		expect(details("Topics.\n \t\nDrawn from EuroSciVoc.")).toBe("Drawn from EuroSciVoc.");
	});

	it("should trim the details", async () => {
		expect(details("Topics.\n\n\n  Drawn.  \n\n")).toBe("Drawn.");
	});

	it("should skip a leading front matter", async () => {
		expect(details("---\ntitle: Topics\n---\n\nTopics.\n\nMore.")).toBe("More.");
		expect(details("---\ntitle: Topics\n---\nTopics.")).toBeUndefined();
	});

	it("should return undefined for a single paragraph", async () => {
		expect(details("Topics the dataset\nis about.")).toBeUndefined();
		expect(details("Topics.\n\n  ")).toBeUndefined();
	});

	it("should return undefined for blank text", async () => {
		expect(details("")).toBeUndefined();
		expect(details(" \n\n ")).toBeUndefined();
	});

});
