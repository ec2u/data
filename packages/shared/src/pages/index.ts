/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { base, EC2U, ec2u } from "@ec2u/data-shared";
import { CCBYNCND40, Copyright, datasets } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, required, resource } from "@metreeca/blue/resource";
import { iri, string } from "@metreeca/blue/string";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const pages = immutable({

	id: resolve(base, "/pages/"),

	isDefinedBy: resolve(base, "/datasets/pages"),
	dataset: datasets.id,

	label: "EC2U Pages",

	title: { en: "EC2U Source Pages" },
	alternative: { en: "EC2U Pages" },
	description: { en: "Web pages from which EC2U Knowledge Hub content is derived." },

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Pages() {
	return resource(Dataset, {

		name: "Pages",
		description: "Web pages from which EC2U Knowledge Hub content is derived."

	}, {

		resources: multiple(reference(Page))

	});
}

export function Page() {
	return resource(Resource, {

		space: ec2u,
		class: ec2u.Page,

		name: "Page",
		description: "A web page from which EC2U Knowledge Hub content is derived."

	}, {

		source: required(iri, {

			name: "Page Source",
			description: "The publisher listing the page among its contents."

		}),

		digest: required(string, {

			name: "Page Digest",
			description: "A unique identification of the content the page carried when it was read."

		})

	});
}
