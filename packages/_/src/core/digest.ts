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

import { isObject, type Value } from "@metreeca/core";
import { by } from "@metreeca/core/order";
import { createHash } from "node:crypto";


/**
 * Digests a JSON value.
 *
 * Values with equal content get the same digest, regardless of the order of their object entries. A workflow can
 * therefore skip any value whose digest it has already processed, and tell whether one it already processed has
 * changed since. Arrays are ordered: reordering their items produces a different digest.
 *
 * The digest covers only what JSON serialisation preserves. Values that differ only in what it drops share a digest:
 * non-finite numbers are digested as `null`, and `-0` as `0`.
 *
 * @param value The JSON value to be digested
 *
 * @returns The lowercase hex-encoded SHA-256 digest of the content of `value`
 */
export function digest(value: Value): string {

	return createHash("sha256")
		.update(JSON.stringify(value, (_, value) => normalise(value)))
		.digest("hex");


	function normalise(value: Value) {
		return isObject(value)
			? Object.fromEntries(Object.entries(value).sort(by(([name]) => name)))
			: value;
	}

}

/**
 * Fingerprints a markdown document.
 *
 * Documents with the same visible text get the same fingerprint, whatever their links point to and however their text
 * is spaced. A workflow comparing the fingerprints of pages it reads on successive runs thus tells a page whose content
 * changed from one that merely carries per-request noise in its link targets, such as session identifiers, cache
 * busting parameters or the rotating tokens of e-mail obfuscation, and skips the latter.
 *
 * Link and image targets and titles, autolinks and link reference definitions are left out, while link text and image
 * alternative text are kept. A change confined to where a link points is therefore not detected.
 *
 * @param markdown The markdown document to be fingerprinted
 *
 * @returns The lowercase hex-encoded SHA-256 digest of the visible text of `markdown`
 */
export function fingerprint(markdown: string): string {

	return digest(markdown
		.replace(/^ {0,3}\[[^\]]+]:\s*\S+.*$/gm, "") // link reference definitions
		.replace(/<[a-z][a-z0-9+.-]*:[^>\s]*>/gi, "") // autolinks
		.replace(/!?\[((?:[^[\]]|\[[^[\]]*])*)]\((?:[^()]|\([^()]*\))*\)/g, "$1") // inline links and images
		.replace(/\s+/g, " ")
		.trim()
	);

}
