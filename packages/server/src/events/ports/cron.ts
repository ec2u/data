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

import { job } from "@metreeca/work/gear-gcp/scheduler.js";
import { CoimbraUniversity } from "@ec2u/data-loader/events/pipes/coimbra-university.js";
import { IasiUniversity360 } from "@ec2u/data-loader/events/pipes/iasi-university-360.js";
import { JenaUniversity } from "@ec2u/data-loader/events/pipes/jena-university.js";
import { LinzUniversity } from "@ec2u/data-loader/events/pipes/linz-university.js";
import { PaviaUniversity } from "@ec2u/data-loader/events/pipes/pavia-university.js";
import { PoitiersUniversity } from "@ec2u/data-loader/events/pipes/poitiers-university.js";
import { SalamancaUniversity } from "@ec2u/data-loader/events/pipes/salamanca-university.js";
import { TurkuUniversity } from "@ec2u/data-loader/events/pipes/turku-university.js";
import { UmeaUniversity } from "@ec2u/data-loader/events/pipes/umea-university.js";
import { execute } from "@ec2u/data-loader/index.core.js";
import { Router } from "express";


export function cron(): Router {

	return Router()

		.use("/coimbra-university", job(() => execute(CoimbraUniversity)))
		.use("/iasi-university-360", job(() => execute(IasiUniversity360)))
		.use("/jena-university", job(() => execute(JenaUniversity)))
		.use("/linz-university", job(() => execute(LinzUniversity)))
		.use("/pavia-university", job(() => execute(PaviaUniversity)))
		.use("/poitiers-university", job(() => execute(PoitiersUniversity)))
		.use("/salamanca-university", job(() => execute(SalamancaUniversity)))
		.use("/turku-university", job(() => execute(TurkuUniversity)))
		.use("/umea-university", job(() => execute(UmeaUniversity)));

}
