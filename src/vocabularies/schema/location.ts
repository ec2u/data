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

import { Thing } from "@/vocabularies/schema/index.js";
import { decimal } from "@metreeca/blue/number";
import { reference } from "@metreeca/blue/reference";
import { resource } from "@metreeca/blue/resource";
import { email, iri, phone, text } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import { optional, repeatable, required } from "@metreeca/blue/value";


export function Location() {
	return union(
		text,
		Place,
		PostalAddress,
		VirtualLocation
	);
}

export function Place() {
	return resource({

		address: optional(reference(PostalAddress)),

		latitude: required(decimal),
		longitude: required(decimal)

	}, {

		extends: Thing

	});
}

export function PostalAddress() {
	return resource({

		addressCountry: optional(text),
		addressRegion: optional(text),
		addressLocality: optional(text),

		postalCode: optional(text),
		streetAddress: optional(text),

		email: optional(email),
		telephone: optional(phone)

	}, {

		extends: Thing

	});
}

export function VirtualLocation() {
	return resource({

		url: repeatable(iri)

	}, {

		extends: Thing

	});
}
