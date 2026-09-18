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

import { FOAFOrganization, FOAFPerson } from "@/vocabularies/foaf.js";
import { SKOSConcept, skos } from "@/vocabularies/skos.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, nonempty, optional, required, resource } from "@metreeca/blue/resource";
import { text } from "@metreeca/blue/string";
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

export function OrgOrganizationalUnit() {
	return resource(OrgOrganization, {

		class: org.OrganizationalUnit

	}, {

		unitOf: nonempty(reference(OrgOrganization), {

			forward: org,
			reverse: org.hasUnit

		})

	});
}

export function OrgOrganization() {
	return resource(FOAFOrganization, {

		space: org,
		class: org.Organization

	}, {

		// ;( `identifier` omitted: it would clash with `schema:identifier`, the term EC2U `Organization` publishes

		prefLabel: required(text, {

			forward: skos

		}),

		altLabel: optional(text, {

			forward: skos

		}),

		definition: optional(text, {

			forward: skos

		}),

		classification: multiple(reference(SKOSConcept)),

		subOrganizationOf: multiple(reference(OrgOrganization)),

		hasSubOrganization: multiple(reference(OrgOrganization), {

			foreign: true

		}),

		hasUnit: multiple(reference(OrgOrganizationalUnit), {

			foreign: true

		}),

		hasHead: multiple(reference(FOAFPerson), {

			foreign: true,

			reverse: org.headOf

		}),

		hasMember: multiple(reference(FOAFPerson), {

			foreign: true

		})

	});
}

export function OrgFormalOrganization() {
	return resource(OrgOrganization, {

		class: org.FormalOrganization

	}, {});
}

export function OrgOrganizationalCollaboration() {
	return resource(OrgOrganization, {

		class: org.OrganizationalCollaboration

	}, {});
}
