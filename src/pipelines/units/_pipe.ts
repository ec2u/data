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
import { Units } from "@/utilities/hub";
import { uuid } from "@/utilities/node/uuid";
import { filter, flatMap, forEach, items, map, merge as mergePipes, pipe, take } from "@metreeca/pipe";

pipe(
	(items(await units.select({ updated: 0 })))
	(take(1))
	(flatMap(lead => mergePipes(
		(items(lead)
			(map(analyze))
			(map(item => lead.updated && matches(lead, item) ? lead
				: merge(lead, { ...item, updated: Date.now() })
			))
		),
		(items(lead)
			(flatMap(explore))
			(filter(item => !!(item.profile || item.website)))
			(map(item => ({

				parent: lead.id,
				university: lead.university,

				formal: item.formal,
				short: item.short,
				acronym: item.acronym,

				summary: item.summary,
				profile: item.profile,
				website: item.website

			})))
			(map(async lead => {

				const current=await units.lookup(lead);

				return !current ? { ...lead, id: `${Units}${uuid()}` }
					: !matches(current, lead) ? merge(current, { ...lead, updated: undefined })
						: current;

			}))
		)
	)))
	(forEach(console.info))
);
