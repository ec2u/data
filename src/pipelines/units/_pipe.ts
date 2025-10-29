/*
 * Copyright © 2025 Metreeca srl
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

import { matches, merge } from "@/pipelines/units/index";
import { units } from "@/pipelines/units/store";
import { analyze } from "@/pipelines/units/tasks/analyze";
import { explore } from "@/pipelines/units/tasks/explore";
import { log, message } from "@/utilities/core/log";
import { Units } from "@/utilities/hub";
import { uuid } from "@/utilities/node/uuid";
import { filter, flatMap, forEach, items, map, merge as mergePipes, peek, pipe } from "@metreeca/pipe";

pipe( // !!! merge update >= fence
	(items(units.select({ updated: 0 }))) // !!! iterate

		(filter(u => u.parent === "https://data.ec2u.eu/units/736ca4af-03c3-4fde-af86-bd8852edc9bd"))

		(flatMap(lead => mergePipes(
			(items(lead)
				(map(guard(analyze)))
				(map(item => lead.updated && matches(lead, item) ? lead
					: merge(lead, { ...item, updated: Date.now() })
				))
			),
			(items(lead)
				(flatMap(guard(explore)))
				(filter(item => !!(item.profile || item.website)))
				(map(item => ({

					...item,

					parent: lead.id,
					university: lead.university

				})))
			)
		)))
		(peek(v => console.info(v))) // !!!
		(forEach(async lead => {

			const current = await units.lookup(lead);

			await units.insert(!current ? { ...lead, id: `${Units}${uuid()}`, updated: Date.now() }
				: !matches(current, lead) ? merge(current, { ...lead, updated: undefined })
					: current
			);

		}))
);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function guard<T, R>(generator: (argument: T) => Promise<R>): typeof generator {
	return async (argument: T) => {
		try {

			return await generator(argument);

		} catch ( error ) {

			log.error(generator.name, message(error));

			return undefined as R;

		}
	};
}
