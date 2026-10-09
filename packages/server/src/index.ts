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

import { client } from "@metreeca/work/gate/client.js";
import { second } from "@metreeca/work/core/temporal.js";
import { serve } from "@metreeca/work/gate/index.js";
import { gcp } from "@metreeca/work/gear-gcp/index.js";
import express, { Router } from "express";
import { resolve } from "node:path";
import { datasets } from "./datasets/index.js";
import { events } from "./events/index.js";
import { units } from "./units/index.js";
import { execute } from "@ec2u/data-system";
import { universities } from "./universities/index.js";


await execute(() => serve(Router()

	.use(express.json())

	.use(client(resolve(import.meta.dirname, "static")))

	.use("/", datasets())
	.use("/universities/", universities())
	.use("/events/", events())
	.use("/units/", units()), {

	port: Number(process.env.PORT ?? 8080),
	proxies: gcp.cloud ? 1 : 0, // trust the Cloud Run front end
	timeout: 8*second // below the 10s Cloud Run grace period before SIGKILL

}));
