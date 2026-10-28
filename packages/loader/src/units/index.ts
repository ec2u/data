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
import { IasiUniversity } from "./pipes/iasi-university/index.js";
import { JenaUniversity } from "./pipes/jena-university/index.js";
import { LinzUniversity } from "./pipes/linz-university/index.js";
import { PoitiersUniversity } from "./pipes/poitiers-university/index.js";
import { TurkuUniversity } from "./pipes/turku-university/index.js";


export function units(): Router {

	return Router()

		.post("/iasi-university", worker(IasiUniversity))
		.post("/jena-university", worker(JenaUniversity))
		.post("/linz-university", worker(LinzUniversity))
		.post("/poitiers-university", worker(PoitiersUniversity))
		.post("/turku-university", worker(TurkuUniversity));

}
