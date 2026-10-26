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

import { iscedf2013 } from "@ec2u/data-shared/taxonomies/isced-f-2013.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { execute } from "../../index.core.js";
import { sync } from "../sinks/sync.js";
import { fill } from "../tasks/fill.js";
import { xml } from "../tasks/xml.js";
import definitions from "./isced-f-2013.json" with { type: "json" };


const Namespace = "http://data.europa.eu/snb/isced-f/";

const DataURL = "https://op.europa.eu/o/opportal-service/euvoc-download-handler"
	+"?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdistribution%2Finternational-education-classification"
	+"%2F20240110-0%2Frdf%2Fskos_ap_eu%2Finternational-education-classification-skos-ap-eu.rdf"
	+"&fileName=international-education-classification-skos-ap-eu.rdf";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(ISCEDF2013);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function ISCEDF2013() {

	return pipe(
		(items(DataURL))
		(xml(Namespace))
		(fill(definitions))
		(sync(iscedf2013))
	);

}
