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

import { Resource } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { ISCED2011Topic } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { ISCEDF2013Topic } from "@ec2u/data-shared/taxonomies/isced-f-2013.js";
import { ec2u } from "@ec2u/data-shared";
import { SchemaLearningResource } from "@ec2u/data-shared/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, resource } from "@metreeca/blue/resource";


export function Offering() {
	return resource(Resource, SchemaLearningResource, {

		space: ec2u,
		class: ec2u.Offering,

		name: "Offering",
		description: "An educational offering of an EC2U partner university."

	}, {

		provider: optional(reference(Organization)),

		educationalLevel: multiple(reference(ISCED2011Topic)),
		about: multiple(reference(ISCEDF2013Topic))

	});
}
