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

import { Icon } from "@metreeca/clay-widgets/icon";
import { Routes } from "@metreeca/clay/router";
import { immutable } from "@metreeca/core/values";
import { ModelPage } from "./model.js";
import { ModelsPage } from "./models.js";


export const models = immutable({

	route: "/models/",
	label: "APIs & Models",
	glyph: <Icon.Package/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates the documentation of the data model served by the hub.
 *
 * Lists the documented shapes at `/models/` and documents each one on a page of its own at `/models/{id}`.
 *
 * @returns The models section
 */
export function Models() {

	return <Routes>{{

		"/": <ModelsPage/>,
		"/:id": <ModelPage/>

	}}</Routes>;

}
