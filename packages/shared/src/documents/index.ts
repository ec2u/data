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

import { CCBYNCND40, Copyright, datasets } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { Person } from "@ec2u/data-shared/persons/index.js";
import { DocumentTopic } from "@ec2u/data-shared/taxonomies/documents.js";
import { EuroSciVocTopic } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import { StakeholderTopic } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { dct } from "@ec2u/data-shared/vocabularies/dct.js";
import { EC2U, base, ec2u, Entity } from "@ec2u/data-shared";
import { schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { date, iri, tag, text } from "@metreeca/blue/string";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const documents = immutable({

	id: resolve(base, "/documents/"),

	isDefinedBy: resolve(base, "/datasets/documents"),
	dataset: datasets.id,

	label: "EC2U Documents",

	title: "EC2U Institutional Documents",
	alternative: "EC2U Documents",
	description: "Regulations, policies and other governance documents shared by EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2023-07-15"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Documents() {
	return resource(Dataset, {

		name: "Documents",
		description: "Regulations, policies and other governance documents shared by EC2U partner universities."

	}, {

		resources: multiple(reference(Document))

	});
}

export function Document() {
	return resource(Resource, {

		space: dct,
		class: ec2u.Document,

		name: "Document",
		description: "A regulation, policy or other governance document shared by an EC2U partner university."

	}, {

		url: multiple(iri, {

			forward: schema

		}),

		identifier: optional(text),
		language: multiple(tag),

		title: required(text),
		description: optional(text),

		creator: optional(Person),
		contributor: multiple(Person),
		publisher: optional(reference(Organization)),

		created: optional(date),
		issued: optional(date),
		modified: optional(date),

		valid: optional(text),

		rights: optional(text),
		accessRights: optional(text),
		license: optional(reference(Entity)),

		type: multiple(reference(DocumentTopic), {

			forward: dct.type

		}),

		subject: multiple(reference(EuroSciVocTopic)),
		audience: multiple(reference(StakeholderTopic)),

		relation: multiple(reference(Document))

	});
}
