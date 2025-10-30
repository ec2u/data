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

import { units } from "@/pipelines/units/store";
import { explore } from "@/pipelines/units/tasks/explore";
import { guard } from "@/utilities/core/log";
import { Units } from "@/utilities/hub";
import { uuid } from "@/utilities/node/uuid";
import { filter, flatMap, forEach, items, map, peek, pipe, toArray } from "@metreeca/pipe";

const leads = await pipe(// !!! merge update >= fence
	(items(units.select({ updated: 0 }))) // !!! iterate
		// (filter(u => u.parent === "https://data.ec2u.eu/units/736ca4af-03c3-4fde-af86-bd8852edc9bd"))
		(toArray())
);


// pipe(
// 	(items(leads))
// 	(flatMap(lead => pipe(
// 		items(lead)
// 		(map(guard(analyze)))
// 		(map(item => lead.updated && matches(lead, item) ? lead
// 			: merge(lead, { ...item, updated: Date.now() })
// 		))
// 	)))
// 	(peek(v => console.info(v)))
// 	(forEach(units.insert))
// );

pipe(
	(items(leads))
	(flatMap(lead => pipe(
		items(lead)
		(flatMap(guard(v => explore(v))))
		(filter(item => !!(item.profile || item.website)))
		(map(item => ({

			...item,

			parent: lead.id,
			university: lead.university

		})))
	)))
	(peek(v => console.info(v)))
	(forEach(async lead => {

		if ( !await units.lookup(lead) ) {
			await units.insert({ ...lead, id: `${Units}${uuid()}`, updated: undefined });
		}

	}))
);
