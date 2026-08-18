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
 * UUID identifiers.
 *
 * Provides the {@link UUID} type for constraining identifiers to the canonical UUID textual form, so that generic
 * strings aren't accepted where a UUID is expected.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9562 RFC 9562 Universally Unique IDentifiers (UUIDs)}
 *
 * @module
 */

/**
 * A UUID in canonical textual form.
 *
 * Constrains strings to the five hyphen-separated groups of the canonical UUID representation; group lengths and
 * hexadecimal digits are not enforced, so malformed values are still to be validated at runtime.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc9562 RFC 9562 Universally Unique IDentifiers (UUIDs)}
 */
export type UUID=`${string}-${string}-${string}-${string}-${string}`;
