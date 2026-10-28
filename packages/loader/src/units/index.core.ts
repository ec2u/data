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
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { organizations } from "@ec2u/data-shared/taxonomies/organizations.js";
import { Unit, units, Units } from "@ec2u/data-shared/units/index.js";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map, mix } from "@metreeca/flow/tasks";
import { validate } from "@metreeca/mime-jsonld";
import { delta, settle } from "@metreeca/pipe-store";
import { execute } from "../index.core.js";
import institutes from "./index.json" with { type: "json" };


const VirtualInstitute = getTopicId(organizations, "university-unit/institute/virtual");


if ( import.meta.main ) {
	await execute(Metadata);
}


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
