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

import { datasets } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map } from "@metreeca/flow/tasks";
import { delta, persist } from "@metreeca/work/tide-store/persist.js";
import { validate } from "@metreeca/work/tide-store/validate.js";
import { execute } from "../../index.core.js";


if ( import.meta.main ) {
	await execute(Metadata);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Metadata() {

	return pipe(
		(items([datasets]))
		(validate(Dataset))
		(map(dataset => delta(datasets.id, Dataset, dataset)))
		(persist({ atomic: true }))
	);

}
