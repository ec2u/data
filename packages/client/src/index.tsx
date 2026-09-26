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

import { createCachingStore } from "@metreeca/keep/caching";
import { createRESTStore } from "@metreeca/keep-rest";
import "@metreeca/tile/index.css";
import { Router, Routes } from "@metreeca/tile-data/router";
import { Store } from "@metreeca/tile-data/store";
import { host } from "@metreeca/tile-hive";
import { render } from "preact";
import { _Datasets, datasets } from "./pages/datasets/index.js";
import { Unknown, unknown } from "./pages/index.js";
import { _Universities, universities } from "./pages/universities/index.js";


render(<Hub/>, host("ec2u-hub"));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Hub() {

	return <Store factory={fetch =>
		createCachingStore(createRESTStore({ trusted: true, fetch }))
	}>

		<Router>

			<Routes>{{

				[datasets.route]: <_Datasets/>,
				[universities.route]: <_Universities/>,

				[unknown.route]: <Unknown/>

			}}</Routes>

		</Router>

	</Store>;

}
