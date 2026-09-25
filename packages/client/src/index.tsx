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

import "@metreeca/tile/index.css";
import { Router, Routes } from "@metreeca/tile-data/router";
import { host } from "@metreeca/tile-hive";
import { render } from "preact";
import { Datasets, DatasetsPath } from "./pages/datasets/index.js";
import { Unknown, UnknownPath } from "./pages/index.js";


render(<Hub/>, host("ec2u-hub"));


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Hub() {

	return <Router>

		<Routes>{{

			[DatasetsPath]: <Datasets/>,

			[UnknownPath]: <Unknown/>

		}}</Routes>

	</Router>;

}
