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

import { SchemaThing, schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { decimal } from "@metreeca/blue/number";
import { nonempty, optional, required, resource } from "@metreeca/blue/resource";
import { email, iri, phone, text } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";


export function SchemaLocation() {
	return union(
		text,
		SchemaPlace,
		SchemaPostalAddress,
		SchemaVirtualLocation
	);
}

export function SchemaPlace() {
	return resource(SchemaThing, {

		class: schema.Place,

		description: "A location with a fixed physical extension."

	}, {

		address: optional(SchemaPostalAddress, {
			description: "Postal address of the place."
		}),

		latitude: required(decimal, {
			description: "WGS84 latitude of the place."
		}),

		longitude: required(decimal, {
			description: "WGS84 longitude of the place."
		})

	});
}

export function SchemaPostalAddress() {
	return resource(SchemaThing, {

		class: schema.PostalAddress,

		description: "A mailing address."

	}, {

		// ;( the locality is what an address is told apart by: a venue is named in a city far more often than in a
		// street, and a street the union could be entered through would leave a city-level address unstatable

		addressLocality: required(text, {
			description: "City or other locality the address lies in."
		}),

		streetAddress: optional(text, {
			description: "Street name and number of the address."
		}),

		postalCode: optional(text, {
			description: "Code assigned to the address by the postal service."
		}),

		addressCountry: optional(text, {
			description: "Country the address lies in."
		}),

		addressRegion: optional(text, {
			description: "Region the address lies in."
		}),

		email: optional(email, {
			description: "Email address of the contact point at the address."
		}),

		telephone: optional(phone, {
			description: "Telephone number of the contact point at the address."
		})

	});
}

export function SchemaVirtualLocation() {
	return resource(SchemaThing, {

		class: schema.VirtualLocation,

		description: "An online location for events and organizations."

	}, {

		url: nonempty(iri)

	});
}
