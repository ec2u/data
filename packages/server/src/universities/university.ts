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

import { base } from "@ec2u/data-shared";
import { universities as dataset, University } from "@ec2u/data-shared/universities/index.js";
import { opt } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { service } from "@metreeca/gear";
import { encodeResource } from "@metreeca/qest/state";
import { createStore } from "@metreeca/work/tide-store/index.js";
import { Request, Router } from "express";


export function UniversityPort(): Router {

	const store = service(createStore);

	return Router({ strict: true, mergeParams: true })

		.get("/", async (request: Request<{ code: string }>, response) => {

			opt(await store.lookup({
					entry: resolve(dataset.id, request.params.code),
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
				university => response.type("json").send(encodeResource(university, { base })),
				() => response.sendStatus(404)
			);

		});

}
