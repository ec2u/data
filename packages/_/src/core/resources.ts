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

import { type Optional } from "@metreeca/core";
import { type IRI, isIRI } from "@metreeca/core/resource";


/**
 * Checks if a value is an HTTP(S) IRI.
 *
 * Tells browsable pages apart from relative paths, `mailto:` and `javascript:` links, and text that is no IRI. Text is
 * checked as it stands: surrounding whitespace and embedded control characters fail the check and are not stripped.
 *
 * @param value The value to check
 *
 * @returns `true` if `value` is an absolute HTTP(S) {@link IRI} with a root-relative path; `false` otherwise
 */
export function isHTTP(value: unknown): value is IRI {

	return isIRI(value, "hierarchical") && /^https?:/i.test(value);

}

/**
 * Extracts the host from an IRI.
 *
 * Provides a compact label for a web address wherever the full IRI is too long to show, for instance as the text of an
 * outbound link. The host keeps the port if `iri` states one, as in `example.org:8080`.
 *
 * @param iri The IRI to extract the host from
 *
 * @returns The host of `iri`, or `undefined` if `iri` names no host, as for opaque IRIs such as `mailto:` addresses and
 *   `urn:` names, for relative references, and for text that is not an IRI at all
 *
 * @example
 *
 * ```typescript
 * getIRIHost("https://www.uc.pt/en/");          // "www.uc.pt"
 * getIRIHost("http://example.org:8080/a");      // "example.org:8080"
 * getIRIHost("mailto:user@example.org");        // undefined
 * ```
 */
export function getIRIHost(iri: string | IRI): Optional<string> {

	return URL.parse(iri)?.host || undefined;

}
