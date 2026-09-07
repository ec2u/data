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

/**
 * REST API endpoints for educational unit resources.
 *
 * Provides endpoints for listing and retrieving units with support for filtering by update timestamp and university.
 *
 * @module
 */

import { job } from "@/_/gear-gcp/scheduler.js";
import { Router } from "express";


export function universities(): Router {

	return Router()

		.use("/universities", Router()

			.get("/", async (request, response) => {

				throw new Error(";( to be implemented"); // !!!

			})

			.get("/:code", async (request, response) => {

				throw new Error(";( to be implemented"); // !!!

			})
		)

		.use("/~universities", Router()

			.use("/wikidata", job(() => Promise.resolve("tbi"))) // !!!

		);

}
