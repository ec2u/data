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

import * as foaf from "@/vocabularies/foaf.js";
import { Concept, skos } from "@/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { property, resource, type ResourceShape } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import { multiple, optional, repeatable, required } from "@metreeca/blue/value";
import { createNamespace } from "@metreeca/core/resource";


export const org = createNamespace("http://www.w3.org/ns/org#", [

	"Organization",
	"FormalOrganization",
	"OrganizationalUnit",
	"OrganizationalCollaboration",

	"identifier",
	"classification",

	"subOrganizationOf",
	"hasSubOrganization",

	"unitOf",
	"hasUnit",

	"headOf",
	"hasHead",
	"memberOf",
	"hasMember"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function OrganizationalUnit() {
	return resource({

		class: org.OrganizationalUnit,
		extends: Organization

	}, {

		unitOf: property({

			forward: org,
			reverse: org.hasUnit

		}, repeatable(reference(Organization)))

	});
}

export function Organization() {
	return resource({

		class: org.Organization,
		extends: foaf.Organization,
		namespace: org

	}, {

		identifier: optional(string), // ;( string value for compatibility with schema:identifier

		prefLabel: property({ forward: skos }, required(text)),
		altLabel: property({ forward: skos }, optional(text)),
		definition: property({ forward: skos }, optional(text)),

		classification: multiple(reference(Concept)),

		subOrganizationOf: multiple(reference(Organization)),
		hasSubOrganization: multiple(reference(Organization, { foreign: true })),

		hasUnit: multiple(reference((): ResourceShape => OrganizationalUnit(), { foreign: true })),

		hasHead: property({

			reverse: org.headOf

		}, multiple(reference(foaf.Person, { foreign: true }))),

		hasMember: multiple(reference(foaf.Person, { foreign: true }))

	});
}

export function FormalOrganization() {
	return resource({

		class: org.FormalOrganization,
		extends: Organization

	}, {});
}

export function OrganizationalCollaboration() {
	return resource({

		class: org.OrganizationalCollaboration,
		extends: Organization

	}, {});
}
