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
import { SchemaLocation } from "@/vocabularies/schema/location.js";
import { multiple, optional, resource } from "@metreeca/blue/resource";
import { email, phone, text } from "@metreeca/blue/string";


export function SchemaOrganization() {
	return resource(SchemaThing, {

		legalName: optional(text),

		email: multiple(email),
		telephone: multiple(phone),

		location: optional(SchemaLocation)

	}, {

		class: schema.Organization

	});
}
