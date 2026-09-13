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

import { SchemaThing, schema } from "@/vocabularies/schema/index.js";
import { decimal } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
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

		address: optional(reference(SchemaPostalAddress)),

		latitude: required(decimal),
		longitude: required(decimal)

	}, {

		class: schema.Place

	});
}

export function SchemaPostalAddress() {
	return resource(SchemaThing, {

		addressCountry: optional(text),
		addressRegion: optional(text),
		addressLocality: optional(text),

		postalCode: optional(text),
		streetAddress: optional(text),

		email: optional(email),
		telephone: optional(phone)

	}, {

		class: schema.PostalAddress

	});
}

export function SchemaVirtualLocation() {
	return resource(SchemaThing, {

		url: nonempty(iri)

	}, {

		class: schema.VirtualLocation

	});
}
