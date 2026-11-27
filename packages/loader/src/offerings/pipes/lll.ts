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

import { offerings } from "@ec2u/data-shared/offerings/index.js";
import { resolve } from "@grafctory/core/resource";
import { pipe } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { distinct, flat, map } from "@grafctory/flow/tasks";
import { service } from "@grafctory/gear";
import { createVault } from "@grafctory/gear/vault";
import { csv } from "@grafctory/mime-csv";
import { fetch } from "@grafctory/data-url";
import { execute } from "../../index.core.js";
import { identify, sync } from "../sinks/sync.js";
import { row } from "./lll.core.js";


const Pipeline = "/offerings/lll";

const Source = resolve(offerings.id, "lll");

const DataURL = "base-offerings-lll-url";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(LLL);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function LLL() {

	const vault = service(createVault);

	return pipe(
		(items(await vault(DataURL)))
		(fetch())
		(csv({ header: true, skip: true, trim: true }))
		(flat(map(row)))
		(distinct(draft => identify(draft) ?? draft.key))
		(sync(Source, {
			pipeline: Pipeline
		}))
	);

}
