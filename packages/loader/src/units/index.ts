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

import { worker } from "@metreeca/gate/worker";
import { Router } from "express";
import { Iasi } from "./pipes/iasi/index.js";
import { Jena } from "./pipes/jena/index.js";
import { Linz } from "./pipes/linz/index.js";
import { Poitiers } from "./pipes/poitiers/index.js";
import { Turku } from "./pipes/turku/index.js";


export function units(): Router {

	return Router()

		.post("/iasi", worker(Iasi))
		.post("/jena", worker(Jena))
		.post("/linz", worker(Linz))
		.post("/poitiers", worker(Poitiers))
		.post("/turku", worker(Turku));

}
