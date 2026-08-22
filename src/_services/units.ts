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

import { _units } from "@/_datasets/units/store.js";
import { NotFound } from "@/_/core/http.js";
import { Router } from "express";


export function units(): Router {
	return Router().use("/units", Router()

		.get("/", async (request, response) => {

			const {

				updated,
				university,
				offset,
				limit

			}: {

				updated?: string;
				university?: string;
				offset?: string;
				limit?: string;

			} = request.query;

			response.json(await _units.select({
				updated: updated ? parseInt(updated, 10) : 1, // return only current processed units
				university,
				offset: offset ? parseInt(offset, 10) : undefined,
				limit: limit ? parseInt(limit, 10) : undefined
			}));

		})

		.get("/:code", async (request, response) => {

			const {

				code

			}: {

				code: string

			} = request.params;

			const unit = await _units.lookup(code);

			if ( unit ) {
				response.json(unit);
			} else {
				response.status(NotFound).json({ error: "unit not found" });
			}

		})

	);
}
