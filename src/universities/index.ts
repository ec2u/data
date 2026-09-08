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

import { Resource } from "@/resources/index.js";
import * as dict from "@/universities/index.core.js";
import { ec2u, Feature } from "@/vocabularies/ec2u.js";
import { FormalOrganization } from "@/vocabularies/org.js";
import { int } from "@metreeca/blue/number";
import { resource } from "@metreeca/blue/resource";
import { iri, year } from "@metreeca/blue/string";
import { repeatable, required, type State } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/structures";

export * from "@/universities/index.core.js";


export const universities = immutable(Object.fromEntries(
	Object.values(dict).map(university => [university.id, university])
));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type University = State<typeof University>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function University() {
	return resource({

		class: ec2u.University,
		extends: [Resource, Feature, FormalOrganization],
		namespace: ec2u

	}, {

		// !!! constraint dataset to getNamespaceIRI(universities)

		depiction: repeatable(iri),
		homepage: repeatable(iri),

		inception: required(year),
		students: required(int),

		city: required(Feature), // !!! reference?
		country: required(Feature) // !!! reference?

	});
}
