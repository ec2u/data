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

import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { universities as dataset, University } from "@ec2u/data-shared/universities/index.js";
import { opt } from "@metreeca/core";
import { service } from "@metreeca/gear";
import { createStore } from "@metreeca/work/tide-store/index.js";
import { Router } from "express";


export function universities(): Router {

	const store = service(createStore);

	return Router({ strict: true })

		.get("/", async (request, response) => {

			response.json(await store.lookup({
				entry: dataset.id,
				shape: Dataset,
				model: {
					resources: {
						id: {},
						label: {}
					}
				}
			}));

		})

		.get("/:code", async (request, response) => {

			opt(await store.lookup({
					entry: `${dataset.id}/${request.params.code}`,
					shape: University,
					model: {
						id: {},
						label: {},
						homepage: {},
						depiction: {},
						inception: {},
						students: {},
						city: { id: {}, label: {} },
						country: { id: {}, label: {} }
					}
				}),
				university => response.json(university),
				() => response.sendStatus(404)
			);

		});

}
