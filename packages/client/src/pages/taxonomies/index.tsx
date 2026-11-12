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

import { Taxonomies as TaxonomiesShape, Taxonomy, Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Routes } from "@metreeca/clay/router";
import { immutable } from "@metreeca/core/values";
import { DatasetPage } from "../../widgets/datasets/dataset.js";
import { models } from "../about/models/index.js";
import { TaxonomiesPage } from "./taxonomies.js";
import { TaxonomyPage } from "./taxonomy.js";
import { TopicPage } from "./topic.js";


export const taxonomies = immutable({

	route: "/taxonomies/",
	label: "Categories",
	glyph: <Icon.Tags/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Taxonomies() {

	return <Routes>{{

		"/;meta": <DatasetPage about={taxonomies} shapes={[TaxonomiesShape, Taxonomy, Topic]} models={models.route}/>,

		"/": <TaxonomiesPage/>,
		"/:taxonomy": <TaxonomyPage/>,
		"/:taxonomy/": <TopicPage/>

	}}</Routes>;

}
