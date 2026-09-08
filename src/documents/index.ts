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
import { ec2u, Entity } from "@/vocabularies/ec2u.js";
import { Organization } from "@/organizations/index.js";
import { Person } from "@/persons/index.js";
import { Topic } from "@/taxonomies/index.js";
import { dct } from "@/vocabularies/dct.js";
import { schema } from "@/vocabularies/schema/index.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource, type ResourceShape } from "@metreeca/blue/resource";
import { date, iri, plain, tag } from "@metreeca/blue/string";
import { multiple, optional, required } from "@metreeca/blue/value";


export function Document() {
	return resource({

		class: ec2u.Document,
		extends: Resource,
		namespace: dct

	}, {

		url: property({ forward: schema }, multiple(iri)),

		identifier: optional(plain),
		language: multiple(tag),

		title: required(plain),
		description: optional(plain),

		creator: optional(Person),
		contributor: multiple(Person),
		publisher: optional(Organization),

		created: optional(date),
		issued: optional(date),
		modified: optional(date),

		valid: optional(plain),

		rights: optional(plain),
		accessRights: optional(plain),
		license: optional(reference(Entity)),

		type: property({ forward: dct.type }, multiple(reference(Topic))),
		subject: multiple(reference(Topic)),
		audience: multiple(reference(Topic)),

		relation: multiple(reference(Document))

	});
}
