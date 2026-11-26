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

import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { execute } from "../../index.core.js";
import { sync } from "../sinks/sync.js";
import { list } from "../tasks/list.js";


const source = "https://portale.unipv.it/it/ricerca/strutture-di-ricerca";

const directories = [
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali",
	"https://portale.unipv.it/it/ricerca/strutture-di-ricerca/grandi-infrastrutture-di-ricerca"
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	execute(PaviaUniversity);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function PaviaUniversity() {

	return pipe(
		(items(directories))
		(list())
		(sync({ university: pavia, source }))
	);

}
