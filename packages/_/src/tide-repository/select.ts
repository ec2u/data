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

import { clip, tidy } from "@metreeca/core/strings";
import type { Task } from "@metreeca/flow";
import { flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { log, report, time } from "@metreeca/tape";
import type { Repository, SPARQL, Tuple } from "@metreeca/wire-sparql";
import { createRepository } from "./index.js";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function select(repository?: Repository): Task<SPARQL, Tuple> {

	const $repository = repository ?? service(createRepository);

	return flat(map(query => {

		logger.info`select <${clip(tidy(query), 50)}>`;

		return time(() => $repository.select(query), (tuples, elapsed) => {
			logger.info`selected <${report(tuples.length)}> tuples in <${report(elapsed)}> ms`;
		});

	}));

}
