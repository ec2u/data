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
import { catalogue } from "./pavia-portal.core.js";
import { lead } from "./pavia-schools.core.js";


const Source = resolve(base, "/offerings/pavia-schools");

const CatalogueURL = "https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/offerta-didattica";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(PaviaSchools);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the medical specialisation schools listed by Pavia University.
 *
 * Lists the schools for medical and non-medical graduates the portal catalogue lists, then crawls their pages,
 * extracting each school by model over what the catalogue states. A catalogue page that fails to load lists no school,
 * leaving the retraction floor to keep the schools it used to list from being retracted wholesale.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function PaviaSchools() {
	return pipe(
		(items([CatalogueURL]))
		(catalogue())
		(map(lead))
		(trim())
		(crawl(Source))
	);
}
