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

import { host } from "@grafctory/clay";
import { Toasts } from "@grafctory/clay-widgets/toasts";
import { Board } from "@grafctory/clay/board";
import { Fetch } from "@grafctory/clay/fetch";
import { Router, Routes } from "@grafctory/clay/router";
import { createRESTStore } from "@grafctory/keep-rest";
import "@grafctory/skin/presets/roboto.css";
import { createCachingStore } from "@grafctory/keep/caching";
import { Store } from "@grafctory/tile";
import { render } from "preact";
import { About, about } from "./pages/about/index.js";
import { API, api } from "./pages/api/index.js";
import { Courses, courses } from "./pages/courses/index.js";
import { Documents, documents } from "./pages/documents/index.js";
import { Events, events } from "./pages/events/index.js";
import { Datasets, datasets } from "./pages/index.js";
import { Programs, programs } from "./pages/programs/index.js";
import { Taxonomies, taxonomies } from "./pages/taxonomies/index.js";
import { Units, units } from "./pages/units/index.js";
import { Universities, universities } from "./pages/universities/index.js";
import { Unknown, unknown } from "./pages/unknown.js";
import { DatasetPage } from "./widgets/datasets/dataset.js";


render(<Hub/>, host("ec2u-hub"));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Hub() {

	return <Board>

		<Fetch>

			<Store factory={fetch =>
				createCachingStore(createRESTStore({ trusted: true, fetch }))
			}>

				<Router>

					<Toasts position={["bottom", "start"]}/>

					<Routes>{{

						[`${datasets.route};meta`]: <DatasetPage about={datasets} models={api.route}/>,

						[datasets.route]: <Datasets/>,
						[universities.route]: <Universities/>,
						[units.route]: <Units/>,
						[programs.route]: <Programs/>,
						[courses.route]: <Courses/>,
						[documents.route]: <Documents/>,
						[events.route]: <Events/>,
						[taxonomies.route]: <Taxonomies/>,

						[api.route]: <API/>,
						[about.route]: <About/>,
						[unknown.route]: <Unknown/>

					}}</Routes>

				</Router>

			</Store>

		</Fetch>

	</Board>;

}
