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

import { euroscivoc } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { execute } from "../../index.core.js";
import { sync } from "../sinks/sync.js";
import { fill } from "../tasks/fill.js";
import { xml } from "../tasks/xml.js";
import definitions from "./euroscivoc.json" with { type: "json" };


const Namespace = "http://data.europa.eu/8mn/euroscivoc/";

const DataURL = "https://op.europa.eu/o/opportal-service/euvoc-download-handler"
	+"?cellarURI=http%3A%2F%2Fpublications.europa.eu%2Fresource%2Fdistribution%2Feuroscivoc%2F20250924-0"
	+"%2Frdf%2Fskos_xl%2FEuroSciVoc.rdf&fileName=EuroSciVoc.rdf";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(EuroSciVoc);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function EuroSciVoc() {

	return pipe(
		(items(DataURL))
		(xml(Namespace))
		(fill(definitions))
		(sync(euroscivoc))
	);

}
