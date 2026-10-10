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

import { validate as validator } from "@metreeca/blue";
import { type ResourceShape } from "@metreeca/blue/resource";
import type { State } from "@metreeca/blue/value";
import { type Lazy } from "@metreeca/core";
import type { Task } from "@metreeca/flow";
import { flat, map, trim } from "@metreeca/flow/tasks";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task admitting only the JSON-LD resource descriptions a shape accepts.
 *
 * A description the shape rejects is logged with its violations and dropped. A single malformed resource costs only
 * itself, not the run, and later stages see only descriptions that conform to the shape. Feeds that must not lose a
 * resource are better validated at the sink, where a rejection fails the run.
 *
 * @typeParam S The type of the resource shape the descriptions are validated against
 *
 * @param shape The resource shape the descriptions are validated against
 *
 * @returns A task forwarding the JSON-LD descriptions `shape` accepts and dropping the others
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if `shape` is malformed
 */
export function validate<S extends Lazy<ResourceShape>>(shape: S): Task<unknown, State<S>> {

	return trim(map(value => validator(value, { shape })({

		value: value => value,

		trace: trace => {

			logger.warn`invalid value (${JSON.stringify(trace)})`;

			return undefined;

		}

	})));

}
