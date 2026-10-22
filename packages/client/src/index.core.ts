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
 * Removes the leading alliance name from a label.
 *
 * @param label The label to be shortened
 *
 * @returns The label without its leading `EC2U` prefix, or the label unchanged if it carries none
 */
export function ec2u(label: string): string {
	return label.replace(/^EC2U\s+/, "");
}

/**
 * Shortens a web address to a compact label.
 *
 * @param url The absolute URL to be shortened
 *
 * @returns The host of `url`, followed by the bracketed language tag its path or query names, if any (`www.uc.pt (en)`)
 */
export function site(url: string): string {

	const { host, pathname, search } = new URL(url);

	const lang = (pathname.match(/\b[a-z]{2}\b(?!-)/i) ?? search.match(/\b[a-z]{2}\b(?!-)/i))?.[0];

	return lang ? `${host} (${lang.toLowerCase()})` : host;

}
