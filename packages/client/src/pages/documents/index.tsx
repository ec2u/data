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

import { Document, Documents as DocumentsShape } from "@ec2u/data-shared/documents/index.js";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Routes } from "@metreeca/clay/router";
import { immutable } from "@metreeca/core/values";
import { DatasetPage } from "../../widgets/datasets/dataset.js";
import { models } from "../about/models/index.js";
import { DocumentPage } from "./document.js";
import { DocumentsPage } from "./documents.js";


export const documents = immutable({

	route: "/documents/",
	label: "Documents",
	glyph: <Icon.Files/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Documents() {

	return <Routes>{{

		"/;meta": <DatasetPage about={documents} shapes={[DocumentsShape, Document]} models={models.route}/>,

		"/": <DocumentsPage/>,
		"/:document": <DocumentPage/>

	}}</Routes>;

}
