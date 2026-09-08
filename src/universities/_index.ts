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

import { Resource } from "@/resources/resources.js";
import { ec2u } from "@/index.js";
import { GeoEntity } from "@/vocabularies/ec2u.js";
import { resource } from "@metreeca/blue/resource";
import { required, type State } from "@metreeca/blue/value";
import { createNamespace } from "@metreeca/core/resource";


export const universities = createNamespace(`${ec2u}/universities/`, [
	"coimbra",
	"iasi",
	"jena",
	"linz",
	"pavia",
	"poitiers",
	"salamanca",
	"turku",
	"umea"
]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type University = State<typeof University>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function University() {
	return resource({

		extends: [Resource, GeoEntity]

	}, {

		// !!! constraint dataset to getNamespaceIRI(universities)

		city: required(GeoEntity), // !!! reference?
		country: required(GeoEntity) // !!! reference?

	});
}
