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
import { explore } from "@/pipelines/units/tasks/explore";
import { Units } from "@/utilities/hub";
import { uuid } from "@/utilities/node/uuid";

units.select({ updated: 0 })

	.then(items => items.slice(0, 1)) // !!!

	.then(items => {

		// const promise=Promise.all(leads.map(lead => Promise.resolve(lead)
		// 	.then(analyze)
		// 	.then(structure)
		// 	.then(item => lead.updated && matches(lead, item) ? lead : merge(lead, { ...item, updated: Date.now() }))
		// ));

		return Promise.all(items.map(item => Promise.resolve(item).then(explore).then(leads => leads
				.filter(lead => lead.profile || lead.website)
				.map(lead => ({

					parent: item.id,
					university: item.university,

					formal: lead.formal,
					short: lead.short,
					acronym: lead.acronym,
					summary: lead.summary,

					profile: lead.profile,
					website: lead.website

				}))
				.map(async lead => {

					const current=await units.lookup(lead);

					return !current ? { ...item, id: `${Units}${uuid()}` }
						: !matches(current, item) ? merge(current, { ...item, updated: undefined })
							: current;


				})
			)
		));

	})

	.then(console.info);
