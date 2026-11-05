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

import { immutable } from "@metreeca/core/values";
import { Icon } from "@metreeca/tile-cell/icon";
import { Routes } from "@metreeca/tile-data/router";
import { DocumentPage } from "./document.js";


export const about = immutable({

	route: "/about/",
	label: "About",
	glyph: <Icon.Help/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function About() {

	return <Routes>{{

		"*": <DocumentPage/>

	}}</Routes>;

}
