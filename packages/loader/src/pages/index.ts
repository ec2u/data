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

import { base, ec2u } from "@ec2u/data-shared";
import { reference } from "@metreeca/blue/reference";
import { id, multiple, required, resource } from "@metreeca/blue/resource";
import { iri, string } from "@metreeca/blue/string";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const pages = immutable({

	id: resolve(base, "/pages/")

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Pages() {
	return resource({

		space: ec2u

	}, {

		id: id(),

		pages: multiple(reference(Page), {

			foreign: true,

			reverse: ec2u.dataset // !!!

		})

	});
}

export function Page() {
	return resource({

		space: ec2u,
		class: ec2u.Page

	}, {

		id: id(),

		dataset: required(reference(Pages)),

		source: required(iri, {

			name: "Page Source",
			description: "The data source whose crawl reached the page."

		}),

		digest: required(string, {

			name: "Page Digest",
			description: "A unique identification of the content the page carried when it was read."

		})

	});
}
