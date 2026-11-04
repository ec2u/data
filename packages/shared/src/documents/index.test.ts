/*
 * Copyright © 2025-2026 Metreeca srl
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
import { documents, getDocumentId } from "./index.js";


const university = "https://data.ec2u.eu/universities/pavia";
const other = "https://data.ec2u.eu/universities/jena";

const key = "https://www.unipv.eu/documents/regulation.pdf";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

describe("getDocumentId", () => {

	it("names the same document for the same key", async () => {
		expect(getDocumentId(university, key)).toBe(getDocumentId(university, key));
	});

	it("names different documents for different keys", async () => {
		expect(getDocumentId(university, key)).not.toBe(getDocumentId(university, `${key}#annex`));
	});

	it("names different documents for equal keys at different universities", async () => {
		expect(getDocumentId(university, key)).not.toBe(getDocumentId(other, key));
	});

	it("names the document as a direct member of the documents catalogue", async () => {
		expect(getDocumentId(university, key)).toMatch(new RegExp(`^${documents.id}[^/]+$`));
	});

});
