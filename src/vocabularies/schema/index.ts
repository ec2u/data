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

import { multiple, nonempty, optional, resource } from "@metreeca/blue/resource";
import { iri, markdown, string, text } from "@metreeca/blue/string";
import { createNamespace } from "@metreeca/core/resource";


export const schema = createNamespace("https://schema.org/", [

	"url",
	"identifier",

	"name",
	"description",
	"disambiguatingDescription",

	"image",
	"caption",
	"author",
	"copyrightNotice",

	"address",
	"latitude",
	"longitude",

	"addressCountry",
	"addressRegion",
	"addressLocality",
	"postalCode",
	"streetAddress",

	"email",
	"telephone",

	"legalName",
	"location",

	"startDate",
	"endDate",
	"inLanguage",
	"isAccessibleForFree",
	"eventStatus",
	"eventAttendanceMode",
	"publisher",
	"about",
	"audience",

	"numberOfCredits",
	"teaches",
	"assesses",
	"competencyRequired",
	"educationalCredentialAwarded",
	"occupationalCredentialAwarded",
	"provider",
	"educationalLevel",

	"credentialCategory",

	"courseCode",
	"timeRequired",
	"coursePrerequisites",

	"courseWorkload",
	"courseMode",
	"instructor",
	"hasCourse",

	"timeToComplete",
	"programPrerequisites"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Base() {
	return resource({

		url: multiple(iri),

		identifier: optional(string), // ;( single plain string: the standard range is Text | URL | PropertyValue

		name: optional(text),
		description: optional(markdown),
		disambiguatingDescription: optional(markdown)

	}, {

		space: schema

	});
}

export function Thing() {
	return resource(Base, {

		image: optional(ImageObject)

	});
}

export function ImageObject() {
	return resource(Base, { // ;( extends Base, not Thing: the inherited `image` would nest ImageObject endlessly

		url: nonempty(iri), // ;( MaxCount(1) would switch the inherited set to a scalar value

		caption: optional(text),
		author: optional(text),
		copyrightNotice: optional(text)

	});
}
