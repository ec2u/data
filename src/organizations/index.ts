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

import { CCBYNCND40, Copyright, datasets } from "@/datasets/index.core.js";
import { Resource } from "@/datasets/index.js";
import { EC2U, base, ec2u } from "@/vocabularies/ec2u.js";
import * as org from "@/vocabularies/org.js";
import * as schema from "@/vocabularies/schema/index.js";
import { Location } from "@/vocabularies/schema/location.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource } from "@metreeca/blue/resource";
import { email, iri, markdown, phone, text } from "@metreeca/blue/string";
import { multiple, optional } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/structures";


export const organizations = immutable({

	id: `${base}/organizations`,

	isDefinedBy: `${base}/datasets/organizations`,
	dataset: datasets.id,

	label: "EC2U Organizations",

	title: "EC2U Related Organizations",
	alternative: "EC2U Organizations",
	description: "Organisations related to EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Organization() {
	return resource({

		class: ec2u.Organization,
		extends: [Resource, org.Organization],
		namespace: ec2u

	}, {

		// !!! schema.Organization cannot join the parents: its inherited `identifier` redefines the org: forward IRI

		url: property({ forward: schema.schema }, multiple(iri)),

		name: property({ forward: schema.schema }, optional(text)),
		description: property({ forward: schema.schema }, optional(markdown)),
		disambiguatingDescription: property({ forward: schema.schema }, optional(markdown)),

		image: property({ forward: schema.schema }, optional(reference(schema.ImageObject, { captive: true }))),

		legalName: property({ forward: schema.schema }, optional(text)),

		email: property({ forward: schema.schema }, multiple(email)),
		telephone: property({ forward: schema.schema }, multiple(phone)),

		location: property({ forward: schema.schema }, optional(Location))

	});
}
