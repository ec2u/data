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

import { serve } from "@metreeca/work/gate/server.js";
import express, { Router } from "express";
import { events } from "./events/index.js";
import { taxonomies } from "./taxonomies/index.js";
import { units } from "./units/index.js";
import { universities } from "./universities/index.js";


await serve(Router()

	.use(express.json())

	.use("/universities/", universities())
	.use("/units/", units())
	.use("/events/", events())

	.use("/taxonomies/", taxonomies())

);
