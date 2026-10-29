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

import { base } from "@ec2u/data-shared";
import { resolve } from "@metreeca/core/resource";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map, trim } from "@metreeca/flow/tasks";
import { execute } from "../../index.core.js";
import { crawl } from "../sinks/crawl.js";
import { lead } from "./pavia-masters.core.js";
import { catalogue } from "./pavia-portal.core.js";


const Source = resolve(base, "/offerings/pavia-masters");

const CatalogueURL = "https://portale.unipv.it/it/didattica/post-laurea/master-universitari/offerta-didattica";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(PaviaMasters);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the first and second level university masters listed by Pavia University.
 *
 * Lists the masters the portal catalogue lists alongside advanced training courses, then crawls their pages,
 * extracting each master by model over what the catalogue states. A catalogue page that fails to load lists no
 * master, leaving the retraction floor to keep the masters it used to list from being retracted wholesale.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function PaviaMasters() {
	return pipe(
		(items([CatalogueURL]))
		(catalogue())
		(map(lead))
		(trim())
		(crawl(Source))
	);
}
