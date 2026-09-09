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

import { validate } from "@/_/gear-store/validate.js";
import { execute } from "@/index.core.js";
import { taxonomies, Topic } from "@/taxonomies/index.js";
import { convert } from "@/taxonomies/tasks/convert.js";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { each } from "@metreeca/flow/sinks";
import { take } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { csv } from "@metreeca/gear-csv";
import { fetch } from "@metreeca/gear-url";
import { createVault } from "@metreeca/gear/vault";


const ISCED2011 = immutable({

	id: `${taxonomies.id}/isced-2011`,

	dataset: taxonomies.id,

	label: "ISCED 2011",

	title: "International Standard Classification of Education 2011",
	alternative: "ISCED 2011",
	description: dedent`
		The ISCED 2011 classification was adopted by the UNESCO General Conference at its 36th session in November 2011.
		Initially developed by UNESCO in the 1970s, and first revised in 1997, the ISCED classification serves as an
		instrument to compile and present education statistics both nationally and internationally.
	`,

	publisher: "http://www.uis.unesco.org/",
	rights: "Copyright © 2012 UNESCO Institute for Statistics",

	source: "https://uis.unesco.org/sites/default/files/documents"
		+"/international-standard-classification-of-education-isced-2011-en.pdf",

	issued: "2011-11-10"

});


const DataURL = "taxonomies-ec2u-isced-2011";

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(sync);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// !!! staleness check
// !!! disposal
// !!! persist(Shape, { atomic: true })

export async function sync() {

	const vault = service(createVault);

	return pipe(
		(items(await vault(DataURL)))
		(fetch())
		(csv(CSVFormat))
		(take(1))
		(convert(ISCED2011))
		(validate(Topic))
			// !!! store
			(each(console.log))
	);

}
