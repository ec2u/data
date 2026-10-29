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

/**
 * Value readers shared by the offerings pipes.
 *
 * @module
 */

import { isString, type Optional } from "@metreeca/core";


/**
 * Reads a non-blank string, trimmed.
 *
 * @param value The value to read
 *
 * @returns The trimmed string, or `undefined` if `value` is not a string or is blank
 */
export function text(value: unknown): Optional<string> {
	return isString(value) && value.trim() !== "" ? value.trim() : undefined;
}

/**
 * Checks whether a string is an HTTP(S) URL.
 *
 * Tells browsable pages apart from relative paths, `mailto:` and `javascript:` links, and text that is no URL.
 *
 * @param url The string to check
 *
 * @returns `true` if `url` is an absolute URL with an `http` or `https` scheme
 */
export function isHTTPS(url: string): boolean {
	return URL.canParse(url) && /^https?:$/.test(new URL(url).protocol);
}
