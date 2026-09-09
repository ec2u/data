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
import { getShapeId, type ResourceShape } from "@metreeca/blue/resource";
import type { State } from "@metreeca/blue/value";
import type { Lazy } from "@metreeca/core";
import { Task } from "@metreeca/flow";
import { filter } from "@metreeca/flow/tasks";
import { log } from "@metreeca/tape";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a task admitting only the values a shape accepts.
 *
 * A value the shape rejects is logged with the violations found and dropped, so a single malformed value costs itself
 * rather than the run and later stages see only values the shape vouches for. Feeds that must not lose a value are
 * better validated at the sink, where a rejection fails the run.
 *
 * @typeParam S The type of the shape the values are validated against
 *
 * @param shape The shape the values are validated against
 *
 * @returns A task forwarding the values `shape` accepts and dropping the others
 *
 * @throws {@link !RangeError RangeError} While the feed is consumed, if `shape` is malformed
 */
export function validate<S extends Lazy<ResourceShape>>(shape: S): Task<State<S>> {

	return filter(value => validator(value, { shape })({

		value: true,

		trace: trace => {

			const id = getShapeId(shape) ?? "?";

			logger.warn`invalid <${id}> value (${JSON.stringify(trace)})`;

			return false;

		}

	}));

}
