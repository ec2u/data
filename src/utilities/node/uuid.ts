/*
 * Copyright © 2025 Metreeca srl
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

import { createHash, randomUUID } from "crypto";

/**
 * Generates a UUID from a string.
 *
 * Behavior depends on whether text is provided:
 *
 * - when text is provided, generates a deterministic UUID v5 (SHA-1-based)
 * - when text is not provided, generates a random UUID v4
 *
 * @param text the string to generate a UUID from (optional)
 *
 * @return the UUID as a lowercase string in standard format
 */
export function uuid(text?: string): string {

	if ( text ) {

		const hash = createHash("sha1").update(text, "utf8").digest();

		// set version 5 and variant bits per RFC 4122

		hash[6] = (hash[6]&0x0f)|0x50;
		hash[8]=(hash[8]&0x3f)|0x80;

		// format as 8-4-4-4-12

		return [
			hash.subarray(0, 4).toString("hex"),
			hash.subarray(4, 6).toString("hex"),
			hash.subarray(6, 8).toString("hex"),
			hash.subarray(8, 10).toString("hex"),
			hash.subarray(10, 16).toString("hex")
		].join("-");

	} else {

		return randomUUID();

	}
}
