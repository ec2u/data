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
import { getIRIHost, isHTTP } from "./resources.js";


describe("isHTTP()", () => {

	it("should accept absolute http and https IRIs", async () => {
		expect(isHTTP("http://example.org/")).toBe(true);
		expect(isHTTP("https://example.org/path?query#fragment")).toBe(true);
		expect(isHTTP("HTTPS://example.org/")).toBe(true);
		expect(isHTTP("https://example.org/città")).toBe(true);
	});

	it("should reject other schemes", async () => {
		expect(isHTTP("mailto:user@example.org")).toBe(false);
		expect(isHTTP("javascript:void(0)")).toBe(false);
		expect(isHTTP("ftp://example.org/")).toBe(false);
		expect(isHTTP("httpx://example.org/")).toBe(false);
	});

	it("should reject relative references", async () => {
		expect(isHTTP("/path")).toBe(false);
		expect(isHTTP("path")).toBe(false);
		expect(isHTTP("//example.org/")).toBe(false);
	});

	it("should reject malformed text", async () => {
		expect(isHTTP("")).toBe(false);
		expect(isHTTP("not a url")).toBe(false);
		expect(isHTTP(" https://example.org/ ")).toBe(false);
		expect(isHTTP("https://example.org/a\tb")).toBe(false);
	});

	it("should reject values other than strings", async () => {
		expect(isHTTP(undefined)).toBe(false);
		expect(isHTTP(null)).toBe(false);
		expect(isHTTP(42)).toBe(false);
		expect(isHTTP(new URL("https://example.org/"))).toBe(false);
	});

});

describe("getIRIHost()", () => {

	it("should return the host of hierarchical IRIs", async () => {
		expect(getIRIHost("https://www.uc.pt/en/")).toBe("www.uc.pt");
		expect(getIRIHost("http://example.org:8080/path?query#fragment")).toBe("example.org:8080");
	});

	it("should return undefined for IRIs naming no host", async () => {
		expect(getIRIHost("mailto:user@example.org")).toBeUndefined();
		expect(getIRIHost("urn:isbn:0451450523")).toBeUndefined();
	});

	it("should return undefined for text that is no IRI", async () => {
		expect(getIRIHost("")).toBeUndefined();
		expect(getIRIHost("not a url")).toBeUndefined();
		expect(getIRIHost("/path")).toBeUndefined();
	});

});
