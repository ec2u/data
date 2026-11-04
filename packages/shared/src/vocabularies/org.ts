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

import { FOAFOrganization, FOAFPerson } from "@ec2u/data-shared/vocabularies/foaf.js";
import { SKOSConcept, skos } from "@ec2u/data-shared/vocabularies/skos.js";
import { dictionary } from "@metreeca/blue/dictionary";
import { reference } from "@metreeca/blue/reference";
import { multiple, nonempty, optional, required, resource } from "@metreeca/blue/resource";
import { text } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
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

		class: org.OrganizationalUnit,

		name: "Org Organizational Unit",

		description: "An organization that is part of a larger organization."

	}, {

		unitOf: nonempty(reference(OrgOrganization), {

			forward: org,
			reverse: org.hasUnit,

			description: "Organizations the unit belongs to."

		})

	});
}

export function OrgOrganization() {
	return resource(FOAFOrganization, {

		space: org,
		class: org.Organization,

		name: "Org Organization",

		description: "A collection of people organized into a social, commercial or political structure."

	}, {

		// ;( `identifier` omitted: it would clash with `schema:identifier`, the term EC2U `Organization` publishes

		prefLabel: required(union(text, dictionary({ uniqueLang: true })), {

			forward: skos,

			description: "Preferred name of the organization."

		}),

		altLabel: optional(text, {

			forward: skos // no description: extending shapes state their own, and blue rejects a conflicting one

		}),

		definition: optional(dictionary({ uniqueLang: true }), {

			forward: skos,

			description: "Statement of the nature and purpose of the organization."

		}),

		classification: multiple(reference(SKOSConcept), {
			description: "Categories classifying the organization."
		}),

		subOrganizationOf: multiple(reference(OrgOrganization), {
			description: "Organizations the organization is part of."
		}),

		hasSubOrganization: multiple(reference(OrgOrganization), {

			foreign: true,

			description: "Organizations that are part of the organization."

		}),

		hasUnit: multiple(reference(OrgOrganizationalUnit), {

			foreign: true,

			description: "Organizational units belonging to the organization."

		}),

		hasHead: multiple(reference(FOAFPerson), {
			description: "Persons leading the organization."
		}),

		hasMember: multiple(reference(FOAFPerson), {

			foreign: true,

			description: "Persons who are members of the organization."

		})

	});
}

export function OrgFormalOrganization() {
	return resource(OrgOrganization, {

		class: org.FormalOrganization,

		name: "Org Formal Organization",

		description: "An organization recognized in legal jurisdictions."

	});
}

export function OrgOrganizationalCollaboration() {
	return resource(OrgOrganization, {

		class: org.OrganizationalCollaboration,

		name: "Org Organizational Collaboration",

		description: "A collaboration between two or more organizations."

	});
}
