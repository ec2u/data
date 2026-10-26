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

import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, required, resource } from "@metreeca/blue/resource";
import { Router } from "express";
import { driver } from "./_.js";


export function Resources() {
	return resource({

		name: "Resources",
		description: "Resources published in issued datasets on the EC2U Knowledge Hub."

	}, {

		id: id(),

		resources: multiple(reference(() => resource(Resource, {

			dataset: required(reference(Dataset))

		})))

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function resources(): Router {

	return Router()
		.use("/", driver(Resources).lookup({

			model: {
				resources: {

					">=dataset.issued": "0001-01-01" // !!! "!dataset.issued": [null] (metreeca/qest#26)

				}
			}

		}));

}
