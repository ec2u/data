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

import { Program, Programs as ProgramsShape } from "@ec2u/data-shared/programs/index.js";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Routes } from "@metreeca/clay/router";
import { immutable } from "@metreeca/core/values";
import { DatasetPage } from "../datasets/dataset.js";
import { ProgramPage } from "./program.js";
import { ProgramsPage } from "./programs.js";


export const programs = immutable({

	route: "/programs/",
	label: "Programs",
	glyph: <Icon.GraduationCap/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Programs() {

	return <Routes>{{

		"/;info": <DatasetPage about={programs} shapes={[ProgramsShape, Program]}/>,

		"/": <ProgramsPage/>,
		"/:program": <ProgramPage/>

	}}</Routes>;

}
