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
 * Scheduler endpoints for Cloud Scheduler triggered tasks.
 *
 * Provides endpoints for running scheduled data processing pipelines with OIDC authentication.
 *
 * @module
 */

import analyze from "@/datasets/units/pipes/analyze/index.js";
import { expandAll } from "@/datasets/units/pipes/expand/index.js";
import { job, Scheduler } from "@/_/gcp/scheduler.js";


/**
 * Express router providing scheduler endpoints.
 */
export default ["/jobs", Scheduler()

	.post("/analyze", job(analyze))
	.post("/expand", job(expandAll))

] as const;
