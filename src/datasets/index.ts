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
import { dct } from "@/vocabularies/dublincore.js";
import { ec2u, Entity } from "@/vocabularies/ec2u.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource } from "@metreeca/blue/resource";
import { date, markdown, plain } from "@metreeca/blue/string";
import { multiple, optional, required, type State } from "@metreeca/blue/value";


export type Dataset = State<typeof Dataset>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Dataset() {
	return resource({

		extends: Entity,
		namespace: dct

	}, {

		title: required(plain),
		alternative: required(plain),
		description: required(markdown),

		created: optional(date),
		issued: optional(date),
		modified: optional(date),

		// !!! Organization publisher();

		source: optional(reference(Entity)),

		rights: optional(plain),
		license: multiple(reference(Entity)),
		accessRights: optional(markdown),

		// !!! Set<Topic> subject();

		resources: property({

			forward: ec2u.resource,
			reverse: ec2u.dataset

		}, multiple(reference(Resource, { foreign: true }))) // !!! foreign to property

	});
}
