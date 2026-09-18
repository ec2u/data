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

import { cron } from "@ec2u/data-server/universities/ports/cron.js";
import { data } from "@ec2u/data-server/universities/ports/data.js";
import { Router } from "express";


export function universities(): Router {

	return Router()
		.use("/universities", data())
		.use("/universities~", cron());

}
