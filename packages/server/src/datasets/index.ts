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
import { datasets as dataset } from "@ec2u/data-shared/datasets/index.core.js";
import { Datasets } from "@ec2u/data-shared/datasets/index.js";
import { opt } from "@metreeca/core";
import { service } from "@metreeca/gear";
import { NotFound } from "@metreeca/http";
import { encodeResource } from "@metreeca/qest/state";
import { createStore } from "@metreeca/work/pipe-store/index.js";
import { Router } from "express";


export function datasets(): Router {

	const store = service(createStore);
	return Router({ strict: true })

		.get("/", async (request, response) => {

			opt(await store.lookup({
					entry: dataset.id,
					shape: Datasets,
					model: {
						resources: {
							id: {},
							label: {}
						}
					}
				}),
				datasets => response.type("json").send(encodeResource(datasets, { base })),
				() => response.sendStatus(NotFound)
			);

		});

}
