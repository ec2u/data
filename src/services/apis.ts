/*
 * Copyright © 2020-2025 EC2U Alliance
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
 * OpenAPI specification for the EC2U Units API.
 *
 * @module
 */

import openapi from "swagger-ui-express";
import units from "./units.json" with { type: "json" };

export const apis = ["/apis", openapi.serve, openapi.setup({

	openapi: "3.0.0",

	info: {
		title: "EC2U Data Microservices API",
		version: "1.0.0",
		description: "REST API data ingestion microservices"
	},

	paths: {
		...units
	}

})] as const;
