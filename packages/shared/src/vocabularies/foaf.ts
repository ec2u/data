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

import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { email, iri, phone, text } from "@metreeca/blue/string";
import { createNamespace } from "@metreeca/core/resource";
import { markdown } from "@metreeca/core/strings";


export const foaf = createNamespace("http://xmlns.com/foaf/0.1/", [

	"Agent",
	"Organization",
	"Person",

	"depiction",
	"homepage",

	"mbox",
	"phone",

	"title",
	"givenName",
	"familyName"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function FOAFAgent() {
	return resource({

		space: foaf,
		class: foaf.Agent,

		name: "Agent",

		description: markdown`
			A person, group or other entity able to act.

			> [!WARNING]
			> Deviates from the FOAF specification to simplify use in frontend applications:
			>
			> - \`mbox\` values are stated as plain strings rather than as \`mailto:\` IRIs
			> - \`phone\` values are stated as plain strings rather than as \`tel:\` IRIs
		`

	}, {

		depiction: multiple(iri, {
			description: "Images depicting the agent."
		}),

		homepage: multiple(iri, {
			description: "Homepages of the agent."
		}),

		mbox: multiple(email, {
			description: "Email addresses of the agent."
		}),

		phone: multiple(phone, {
			description: "Phone numbers of the agent."
		})

	});
}

export function FOAFOrganization() {
	return resource(FOAFAgent, {

		class: foaf.Organization,

		name: "Organization",

		description: "A group of people acting together as a single agent."

	});
}

export function FOAFPerson() {
	return resource(FOAFAgent, {

		class: foaf.Person,

		name: "Person",

		description: "An individual person."

	}, {

		title: optional(text, {
			description: "Professional or honorific title of the person."
		}),

		givenName: required(text, {
			description: "Given name of the person."
		}),

		familyName: required(text, {
			description: "Family name of the person."
		})

	});
}
