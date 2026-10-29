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

import { opt } from "@metreeca/core";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import type { Draft } from "../sinks/sync.js";


/**
 * Creates a topic definition backfiller.
 *
 * Fills in the definitions the source leaves out with the ones drafted for them by AI tools, flagging the drafts so
 * completed as generated; drafts the source defines, and drafts no definition is supplied for, are passed on unchanged.
 *
 * @param definitions The English definitions of the topics, keyed by their draft identifier
 *
 * @returns A task backfilling a feed of topic drafts with the supplied definitions
 */
export function fill(definitions: { readonly [path: string]: string }): Task<Draft> {

	return map(draft => draft.definition !== undefined ? draft : {
		...draft, ...opt(definitions[draft.id], definition => ({
			definition: { en: definition },
			generated: true
		}))
	});

}
