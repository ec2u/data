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
import { focus, html, untag } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { denoise } from "@metreeca/work/mime-xml/denoise.js";
import { execute } from "../../index.core.js";
import { crawl } from "../sinks/crawl.js";
import { doctorates, lead } from "./pavia-doctorates.core.js";


const Source = resolve(base, "/offerings/pavia-doctorates");

const IndexURL = "https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(PaviaDoctorates);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the doctoral programs listed by the Pavia doctoral school.
 *
 * Reads the doctorates the school index page lists by model, then crawls their pages, extracting each program by
 * model over what the index states. An index that fails to load, or that the model fails to read, yields no leads, so
 * the run retracts nothing on the strength of it and fails on the retraction floor instead.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function PaviaDoctorates() {

	return pipe(
		(items([IndexURL]))
		(fetch())
		(html())
		(denoise())
		(focus())
		(untag())
		(doctorates())
		(map(lead))
		(trim())
		(crawl(Source))
	);

}
