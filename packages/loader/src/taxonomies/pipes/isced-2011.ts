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

import { execute } from "@ec2u/data-loader/index.core.js";
import { isced2011 } from "@ec2u/data-loader/taxonomies/pipes/isced-2011.core.js";
import { sync } from "@ec2u/data-loader/taxonomies/sinks/sync.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";


const DataURL = "taxonomies-ec2u-isced-2011";


if ( import.meta.main ) {
	await execute(ISCED2011);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function ISCED2011() {

	const vault = service(createVault);

	return pipe(
		(items(await vault(DataURL)))
		(sync(isced2011))
	);

}
