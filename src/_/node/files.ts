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

/**
 * Utilities for file operations
 *
 * @module
 */

import { isString } from "@metreeca/core";
import { writeFileSync } from "fs";
import { readFile } from "fs/promises";

const cache=new Map<string, Promise<string>>();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Reads a file as UTF-8 text with global caching.
 *
 * @param url - The file URL or path relative to base. If url starts with `.` and base is provided, the trailing
 * file extension (including compound extensions) in the base URL is replaced with url.
 * @param base - The base URL to resolve relative paths against
 *
 * @returns A promise resolving to the file contents as a string
 */
export function file(url: string | URL, base?: string | URL): Promise<string> {

	const src = base && isString(url) && /^(\.[a-z0-9]+)+$/i.test(url)
		? new URL(new URL(base).href.replace(/(\.[a-z0-9]+)+$/i, url), base)
		: new URL(url, base);

	const key=src.href;

	if ( !cache.has(key) ) {
		cache.set(key, readFile(src, "utf-8"));
	}

	return cache.get(key)!;
}

/**
 * Creates a function that writes data to a file and returns it unmodified.
 *
 * @typeParam T The type of data to be written and returned
 *
 * @param path The file path to write to
 * @param append If `true`, appends data to the file instead of overwriting it (default: `false`)
 *
 * @returns A function that accepts data, writes it to the specified file, and returns the data unchanged
 *
 * @remarks
 *
 * String data is written as-is. Non-string data is serialized to JSON with 4-space indentation.
 */
export function dump<T>(path: string, {

	append

}: {

	append?: boolean

} = {}): (data: T) => T {

	return (data: T) => {

		writeFileSync(
			path,
			isString(data) ? data : JSON.stringify(data, null, 4),
			{ encoding: "utf8", flag: append ? "a" : "w" }
		);

		return data;
	};

}
