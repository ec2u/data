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
import { sdgs } from "@ec2u/data-shared/taxonomies/sdgs.js";
import { sync } from "../sinks/sync.js";
import { csv } from "../tasks/csv.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";


const DataURL = "taxonomies-ec2u-sdgs";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(SDGs);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function SDGs() {

	const vault = service(createVault);

	return pipe(
		(items(await vault(DataURL)))
		(csv())
		(sync(sdgs))
	);

}
