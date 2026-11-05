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

import { Unit, Units as UnitsShape } from "@ec2u/data-shared/units/index.js";
import { immutable } from "@metreeca/core/values";
import { Icon } from "@metreeca/tile-cell/icon";
import { Routes } from "@metreeca/tile-data/router";
import { DatasetPage } from "../datasets/dataset.js";
import { UnitPage } from "./unit.js";
import { UnitsPage } from "./units.js";


export const units = immutable({

	route: "/units/",
	label: "Units",
	glyph: <Icon.FlaskConical/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Units() {

	return <Routes>{{

		"/;info": <DatasetPage about={units} shapes={[UnitsShape, Unit]}/>,

		"/": <UnitsPage/>,
		"/:unit": <UnitPage/>

	}}</Routes>;

}
