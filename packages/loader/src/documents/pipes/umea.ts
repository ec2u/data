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

import { umea } from "@ec2u/data-shared/index.core.js";
import { pipe } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { service } from "@grafctory/gear";
import { createVault } from "@grafctory/gear/vault";
import { execute } from "../../index.core.js";
import { sync } from "../sinks/sync.js";
import { csv } from "../tasks/csv.js";


const Pipeline = "/documents/umea";

const DataURL = "base-documents-umea-url";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Umea);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Umea() {

	const vault = service(createVault);

	return pipe(
		(items(await vault(DataURL)))
		(csv(umea))
		(sync(umea, {
			pipeline: Pipeline
		}))
	);

}
