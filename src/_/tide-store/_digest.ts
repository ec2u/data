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
 * Digest of a JSON value.
 *
 * Identifies the content a value carries rather than the value itself, so that a workflow may tell by comparison
 * whether something it already processed has since changed.
 */
export type Digest =
	string


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Digests a JSON value.
 *
 * Values equal in content are assigned the same {@link Digest}, whatever the order their object entries were defined
 * in, so a workflow may skip whatever it already processed under a known digest. Arrays, in contrast, are ordered:
 * reordering their items yields a different digest.
 *
 * Only the distinctions JSON records are taken into account, so values differing solely in a respect it leaves out
 * share a digest: non-finite numbers are digested as `null` and `-0` as `0`.
 *
 * @param value The JSON value to be digested
 *
 * @returns The lowercase hex-encoded SHA-256 digest of the content of `value`
 */
export function digest(value: Value): Digest {

	return createHash("sha256")
		.update(JSON.stringify(value, (_, value) => normalise(value)))
		.digest("hex");


	function normalise(value: Value) {
		return isObject(value)
			? Object.fromEntries(Object.entries(value).sort(by(([name]) => name)))
			: value;
	}

}
