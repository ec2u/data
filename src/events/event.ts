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

import { Organization } from "@/organizations/index.js";
import { Resource } from "@/resources/index.js";
import { Topic } from "@/taxonomies/index.js";
import { CommentLength, ec2u, LabelLength } from "@/vocabularies/ec2u.js";
import { Event as SchemaEvent } from "@/vocabularies/schema/event.js";
import { reference } from "@metreeca/blue/reference";
import { resource } from "@metreeca/blue/resource";
import { plain } from "@metreeca/blue/string";
import { multiple, optional, type State } from "@metreeca/blue/value";


export type Event = State<typeof Event>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Event() {
	return resource({

		class: ec2u.Event,
		extends: [Resource, SchemaEvent],
		namespace: ec2u

	}, {

		name: optional(plain({ maxLength: LabelLength })), // ;( sanity check on model hallucinations
		disambiguatingDescription: optional(plain({ maxLength: CommentLength })),

	});
}
