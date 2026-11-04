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

import { createRESTStore } from "@metreeca/keep-rest";
import "@metreeca/tile/index.css";
import { createCachingStore } from "@metreeca/keep/caching";
import { Board } from "@metreeca/tile-data/board";
import { Fetch } from "@metreeca/tile-data/fetch";
import { Router, Routes } from "@metreeca/tile-data/router";
import { Store } from "@metreeca/tile-data/store";
import { host } from "@metreeca/tile-hive";
import { Toast } from "@metreeca/tile-hive/toast";
import { render } from "preact";
import { About, about } from "./pages/about/index.js";
import { Courses, courses } from "./pages/courses/index.js";
import { Datasets, datasets } from "./pages/datasets/index.js";
import { Documents, documents } from "./pages/documents/index.js";
import { Events, events } from "./pages/events/index.js";
import { Programs, programs } from "./pages/programs/index.js";
import { Taxonomies, taxonomies } from "./pages/taxonomies/index.js";
import { Units, units } from "./pages/units/index.js";
import { Universities, universities } from "./pages/universities/index.js";
import { Unknown, unknown } from "./pages/index.js";


render(<Hub/>, host("ec2u-hub"));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Hub() {

	return <Board>

		<Fetch>

			<Store factory={fetch =>
				createCachingStore(createRESTStore({ trusted: true, fetch }))
			}>

				<Router>

					<Toast/>

					<Routes>{{

						[datasets.route]: <Datasets/>,
						[universities.route]: <Universities/>,
						[units.route]: <Units/>,
						[programs.route]: <Programs/>,
						[courses.route]: <Courses/>,
						[documents.route]: <Documents/>,
						[events.route]: <Events/>,
						[taxonomies.route]: <Taxonomies/>,

						[about.route]: <About/>,
						[unknown.route]: <Unknown/>

					}}</Routes>

				</Router>

			</Store>

		</Fetch>

	</Board>;

}
