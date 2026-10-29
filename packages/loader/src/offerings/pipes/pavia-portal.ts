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

import { execute } from "../../index.core.js";
import { PaviaDoctorates } from "./pavia-doctorates.js";
import { PaviaMasters } from "./pavia-masters.js";
import { PaviaSchools } from "./pavia-schools.js";
import { PaviaTraining } from "./pavia-training.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(PaviaPortal);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the post-graduate offerings Pavia University lists.
 *
 * Runs the doctorates, specialisation schools, masters and advanced training pipes side by side, so that one failing
 * pipe never keeps the others from completing; the run fails once all four have settled if any of them failed, so
 * the scheduler sees the failure and retries the whole run, its unchanged pages costing no extraction.
 *
 * @returns A promise resolving to the outcomes of the four pipes
 *
 * @throws {@link !AggregateError AggregateError} If any of the pipes fails, listing the errors of the failed ones
 */
export async function PaviaPortal() {

	const settled = await Promise.allSettled([PaviaDoctorates(), PaviaSchools(), PaviaMasters(), PaviaTraining()]);
	const errors = settled.flatMap(result => result.status === "rejected" ? [result.reason] : []);

	return errors.length === 0 ? settled : Promise.reject(new AggregateError(errors, "failed Pavia portal pipes"));

}
