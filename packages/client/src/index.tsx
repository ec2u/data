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

import { Dataset, Datasets as DatasetsShape } from "@ec2u/data-shared";
import { host } from "@metreeca/clay";
import { Toasts } from "@metreeca/clay-widgets/toasts";
import { Board } from "@metreeca/clay/board";
import { Fetch } from "@metreeca/clay/fetch";
import { Router, Routes } from "@metreeca/clay/router";
import { createRESTStore } from "@metreeca/keep-rest";
import "@metreeca/skin/presets/roboto.css";
import { createCachingStore } from "@metreeca/keep/caching";
import { Store } from "@metreeca/tile";
import { render } from "preact";
import { About, about } from "./pages/about/index.js";
import { Courses, courses } from "./pages/courses/index.js";
import { DatasetPage } from "./widgets/dataset.js";
import { models } from "./pages/about/models/index.js";
import { Documents, documents } from "./pages/documents/index.js";
import { Events, events } from "./pages/events/index.js";
import { Datasets, datasets } from "./pages/index.js";
import { Programs, programs } from "./pages/programs/index.js";
import { Taxonomies, taxonomies } from "./pages/taxonomies/index.js";
import { Units, units } from "./pages/units/index.js";
import { Universities, universities } from "./pages/universities/index.js";
import { Unknown, unknown } from "./pages/unknown.js";


render(<Hub/>, host("ec2u-hub"));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Hub() {

	return <Board>

		<Fetch>

			<Store factory={fetch =>
				createCachingStore(createRESTStore({ trusted: true, fetch }))
			}>

				<Router>

					<Toasts/>

					<Routes>{{

						[`${datasets.route};meta`]: <DatasetPage about={datasets} shapes={[DatasetsShape, Dataset]} models={models.route}/>,

						[datasets.route]: <Datasets/>,
						[universities.route]: <Universities/>,
						[units.route]: <Units/>,
						[programs.route]: <Programs/>,
						[courses.route]: <Courses/>,
						[documents.route]: <Documents/>,
						[events.route]: <Events/>,
						[taxonomies.route]: <Taxonomies/>,

						"/models/": "/about/models/",
						[about.route]: <About/>,
						[unknown.route]: <Unknown/>

					}}</Routes>

				</Router>

			</Store>

		</Fetch>

	</Board>;

}
