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

import { type IRI, isIRI } from "@metreeca/core/resource";


/**
 * Checks if a value is an HTTP(S) IRI.
 *
 * Tells browsable pages apart from relative paths, `mailto:` and `javascript:` links, and text that is no IRI. Text is
 * checked as it stands: surrounding whitespace and embedded control characters fail the check rather than being cleaned.
 *
 * @param value The value to check
 *
 * @returns `true` if `value` is an absolute {@link IRI} with an `http` or `https` scheme and a root-relative path;
 *   `false` otherwise
 */
export function isHTTP(value: unknown): value is IRI {

	return isIRI(value, "hierarchical") && /^https?:/i.test(value);

}
