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

import { alliance } from "@ec2u/data-shared/organizations/index.js";
import { getConceptId } from "@ec2u/data-shared/taxonomies/index.js";
import { organizations } from "@ec2u/data-shared/taxonomies/organizations.js";
import { Unit, units, Units } from "@ec2u/data-shared/units/index.js";
import { resolve } from "@grafctory/core/resource";
import { immutable } from "@grafctory/core/values";
import { pipe } from "@grafctory/flow";
import { items } from "@grafctory/flow/feeds";
import { map, mix } from "@grafctory/flow/tasks";
import { validate } from "@grafctory/mime-jsonld";
import { delta, settle } from "@grafctory/pipe-store";
import { execute } from "../index.core.js";
import institutes from "./index.json" with { type: "json" };


const VirtualInstitute = getConceptId(organizations, "university-unit/institute/virtual");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The EC2U virtual institutes, units of the alliance itself that university units take part in.
 */
export const VirtualInstitutes = immutable(institutes.map(({ id, ...institute }) => ({

	...institute,

	id: resolve(units.id, id),

	dataset: units.id,

	unitOf: [alliance.id],
	classification: [VirtualInstitute]

})));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Metadata);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Metadata() {

	return pipe(
		(items([units]))
		(validate(Units))
		(map(catalogue => delta(units.id, Units, catalogue)))
		(mix(pipe(
			(items(VirtualInstitutes))
			(validate(Unit))
			(map(institute => delta(institute.id, Unit, institute)))
		)))
		(settle({ atomic: true }))
	);

}
