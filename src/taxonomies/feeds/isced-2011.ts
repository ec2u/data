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

import { createGCPVault } from "@/_/gcp/secrets.js";
import { createFetch, success, throttle } from "@metreeca/core/fetch";
import { immutable } from "@metreeca/core/structures";
import { bind, context, service } from "@metreeca/flow";
import { csv } from "@metreeca/flow-csv";
import { createVault } from "@metreeca/flow/vault";
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { forEach } from "@metreeca/pipe/sinks";
import { map, take } from "@metreeca/pipe/tasks";


const DataURL = "taxonomies-ec2u-isced-2011";

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


if ( import.meta.main ) {
	sync();
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

type Concept = {

	readonly id: string;
	readonly label: string;
	readonly alternative: string;
	readonly definition: string;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function sync() {


	await context(

		bind(createVault, createGCPVault),
		bind(createFetch, () => createFetch(success(), throttle({ minimum: 1000 }))) // !!! caching

	)(async () => {

		const url = await service(createVault)(DataURL);
		const fetch = service(createFetch);

		return await pipe(
			(items(url))
			(map(fetch))
			(map(response => response.text())) // !!!
			(csv<Concept>(CSVFormat))
			(take(3))
			(forEach(console.log))
		);

	});

}
