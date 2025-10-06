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

/**
 * @module
 *
 * Utilities for file operations
 */

import { readFile } from "fs/promises";

const cache=new Map<string, Promise<string>>();


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Reads a file as UTF-8 text with global caching.
 *
 * @param url - The file URL or path relative to base
 * @param base - The base URL to resolve relative paths against
 *
 * @returns A promise resolving to the file contents as a string
 */
export function file(url: string | URL, base?: string | URL): Promise<string> {

	const key=new URL(url, base).href;

	if ( !cache.has(key) ) {
		cache.set(key, readFile(new URL(url, base), "utf-8"));
	}

	return cache.get(key)!;
}
