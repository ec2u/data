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

import { Resource } from "@/datasets/index.js";
import { Topic } from "@/taxonomies/index.js";
import { ec2u } from "@/vocabularies/ec2u.js";
import { LearningResource } from "@/vocabularies/schema/learning.js";
import { reference } from "@metreeca/blue/reference";
import { resource } from "@metreeca/blue/resource";
import { multiple } from "@metreeca/blue/value";


export function Offering() {
	return resource(Resource, LearningResource, {

		// ;( `provider` not narrowed to an embedded EC2U `Organization`: an inherited reference cannot be swapped
		// ;( for an embedded resource

		// !!! pin `educationalLevel` to the ISCED 2011 taxonomy and `about` to ISCED-F 2013: both take a narrowed
		// !!! `Topic` shape carrying an id `pattern`, and neither taxonomy is ported yet

		educationalLevel: multiple(reference(Topic)),
		about: multiple(reference(Topic))

	}, {

		space: ec2u,
		class: ec2u.Offering

	});
}
