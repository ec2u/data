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

import { resource } from "@metreeca/blue/resource";
import { email, iri, phone, text } from "@metreeca/blue/string";
import { multiple, optional, required } from "@metreeca/blue/value";
import { createNamespace } from "@metreeca/core/resource";


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

export function Agent() {
	return resource({

		depiction: multiple(iri),
		homepage: multiple(iri),

		mbox: multiple(email),
		phone: multiple(phone)

	}, {

		space: foaf,
		class: foaf.Agent

	});
}

export function Organization() {
	return resource(Agent, {}, {

		class: foaf.Organization

	});
}

export function Person() {
	return resource(Agent, {

		title: optional(text),

		givenName: required(text),
		familyName: required(text)

	}, {

		class: foaf.Person

	});
}
