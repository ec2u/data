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
import { Coimbra } from "./pipes/coimbra.js";
import { Linz } from "./pipes/linz.js";
import { LLL } from "./pipes/lll.js";
import { Poitiers } from "./pipes/poitiers.js";
import { Salamanca } from "./pipes/salamanca.js";


export function offerings(): Router {

	return Router()

		.post("/coimbra", worker(Coimbra))
		.post("/linz", worker(Linz))
		.post("/lll", worker(LLL))
		.post("/poitiers", worker(Poitiers))
		.post("/salamanca", worker(Salamanca));

}
