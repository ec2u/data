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
 * CSV processing tasks.
 *
 * @module
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4180 RFC 4180 Common Format and MIME Type for CSV Files}
 */

export * from "./csv.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * A CSV record.
 *
 * Maps each field of a data row to its value, keyed either by column label or by positional index.
 */
export type Record = {

	readonly [label: string]: string

}
