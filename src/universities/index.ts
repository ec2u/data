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

import { CCBYNCND40, Copyright, datasets } from "@/datasets/index.core.js";
import { Organization } from "@/organizations/index.js";
import * as dict from "@/universities/index.core.js";
import { EC2U, base, ec2u, Feature } from "@/vocabularies/ec2u.js";
import { FormalOrganization } from "@/vocabularies/org.js";
import { int } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { resource } from "@metreeca/blue/resource";
import { iri, year } from "@metreeca/blue/string";
import { multiple, repeatable, required } from "@metreeca/blue/value";
import { immutable } from "@metreeca/core/structures";

export * from "@/universities/index.core.js";


export const universities = immutable({

	id: `${base}/universities`,

	isDefinedBy: `${base}/datasets/universities`,
	dataset: datasets.id,

	label: "EC2U Universities",

	title: "EC2U Partner Universities",
	alternative: "EC2U Universities",
	description: "Background, historical context and statistical data about EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2022-01-01"

});

export const partners = immutable(Object.fromEntries(
	Object.values(dict).map(university => [university.id, university])
));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function University() {
	return resource({

		class: ec2u.University,
		extends: [Organization, Feature, FormalOrganization],
		namespace: ec2u

	}, {

		// !!! constraint dataset to getNamespaceIRI(universities)

		// ;( `hasUnit` not narrowed to `Unit`: the inherited `org.OrganizationalUnit` target is reached through a
		// ;( thunk, and a thunk builds a fresh closure per call, so the lineage never matches by structure

		subOrganizationOf: multiple(reference(Organization)),
		hasSubOrganization: multiple(reference(Organization)),

		depiction: repeatable(iri),
		homepage: repeatable(iri),

		inception: required(year),
		students: required(int),

		city: required(Feature), // !!! reference?
		country: required(Feature) // !!! reference?

	});
}
