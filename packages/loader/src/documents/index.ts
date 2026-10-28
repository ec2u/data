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
import { CoimbraUniversity } from "./pipes/coimbra-university.js";
import { IasiUniversity } from "./pipes/iasi-university.js";
import { JenaUniversity } from "./pipes/jena-university.js";
import { LinzUniversity } from "./pipes/linz-university.js";
import { PaviaUniversity } from "./pipes/pavia-university.js";
import { PoitiersUniversity } from "./pipes/poitiers-university.js";
import { SalamancaUniversity } from "./pipes/salamanca-university.js";
import { TurkuUniversity } from "./pipes/turku-university.js";
import { UmeaUniversity } from "./pipes/umea-university.js";


export function documents(): Router {

	return Router()

		.post("/coimbra-university", worker(CoimbraUniversity))
		.post("/iasi-university", worker(IasiUniversity))
		.post("/jena-university", worker(JenaUniversity))
		.post("/linz-university", worker(LinzUniversity))
		.post("/pavia-university", worker(PaviaUniversity))
		.post("/poitiers-university", worker(PoitiersUniversity))
		.post("/salamanca-university", worker(SalamancaUniversity))
		.post("/turku-university", worker(TurkuUniversity))
		.post("/umea-university", worker(UmeaUniversity));

}
