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

import { sync } from "@/events/sinks/sync.js";
import { execute } from "@/index.core.js";
import { organizations } from "@/organizations/index.js";
import { umea } from "@/universities/index.core.js";
import { immutable } from "@metreeca/core/structures";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { fetch } from "@metreeca/gear-url";
import { html, link, xpath } from "@metreeca/gear-xml";


const Publisher = immutable({

	id: "https://www.umu.se/en/events/",

	dataset: organizations.id,
	university: umea.id,

	label: "Umeå University / Events",
	prefLabel: "Umeå University / Events"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(UmeaUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function UmeaUniversity() {

	return pipe(
		(items(Publisher.id))
		(fetch())
		(html())
		(xpath())
		(flat(map(path => pipe(
			items(path("//a[@class='eventlink']/@href"))
			(map(link))
		))))
		(sync(Publisher))
	);

}
