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

import { Resource } from "@/resources/index.js";
import { Topic } from "@/taxonomies/index.js";
import { ec2u } from "@/vocabularies/ec2u.js";
import * as org from "@/vocabularies/org.js";
import * as schema from "@/vocabularies/schema/index.js";
import { Location } from "@/vocabularies/schema/location.js";
import { property, resource } from "@metreeca/blue/resource";
import { email, phone, plain } from "@metreeca/blue/string";
import { multiple, optional, type State } from "@metreeca/blue/value";


export type Organization = State<typeof Organization>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Organization() {
	return resource({

		class: ec2u.Organization,
		extends: [Resource, org.Organization],
		namespace: ec2u

	}, {

		// !!! schema.Organization cannot join the parents: its inherited `identifier` redefines the org: forward IRI

		legalName: property({ forward: schema.schema }, optional(plain)),

		email: property({ forward: schema.schema }, multiple(email)),
		telephone: property({ forward: schema.schema }, multiple(phone)),

		location: property({ forward: schema.schema }, optional(Location))

	});
}
