/*
 * Copyright © 2025-2026 Metreeca srl
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

import { execute } from "@/index.core.js";
import { events } from "@/taxonomies/pipes/events.core.js";
import { sync } from "@/taxonomies/sinks/sync.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";


const DataURL = "taxonomies-ec2u-events";


if ( import.meta.main ) {
	await execute(Events);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Events() {

	const vault = service(createVault);

	return pipe(
		(items(await vault(DataURL)))
		(sync(events))
	);

}
