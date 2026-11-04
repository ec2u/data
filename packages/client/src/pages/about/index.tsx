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

import { Course, Courses as CoursesShape } from "@ec2u/data-shared/courses/index.js";
import { Dataset, Datasets as DatasetsShape } from "@ec2u/data-shared/datasets/index.js";
import { Document, Documents as DocumentsShape } from "@ec2u/data-shared/documents/index.js";
import { Event, Events as EventsShape } from "@ec2u/data-shared/events/index.js";
import { Program, Programs as ProgramsShape } from "@ec2u/data-shared/programs/index.js";
import { Taxonomies as TaxonomiesShape, Taxonomy, Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { Unit, Units as UnitsShape } from "@ec2u/data-shared/units/index.js";
import { Universities as UniversitiesShape, University } from "@ec2u/data-shared/universities/index.js";
import { immutable } from "@metreeca/core/values";
import { Icon } from "@metreeca/tile-cell/icon";
import { Routes } from "@metreeca/tile-data/router";
import { courses } from "../courses/index.js";
import { DatasetPage } from "../datasets/dataset.js";
import { datasets } from "../index.js";
import { documents } from "../documents/index.js";
import { events } from "../events/index.js";
import { programs } from "../programs/index.js";
import { taxonomies } from "../taxonomies/index.js";
import { units } from "../units/index.js";
import { universities } from "../universities/index.js";
import { DocumentPage } from "./document.js";


export const about = immutable({

	route: "/about/",
	label: "About",
	glyph: <Icon.Help/>

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function About() {

	return <Routes>{{

		"/datasets": <DatasetPage about={datasets} shapes={[DatasetsShape, Dataset]}/>,
		"/datasets/universities": <DatasetPage about={universities} shapes={[UniversitiesShape, University]}/>,
		"/datasets/units": <DatasetPage about={units} shapes={[UnitsShape, Unit]}/>,
		"/datasets/programs": <DatasetPage about={programs} shapes={[ProgramsShape, Program]}/>,
		"/datasets/courses": <DatasetPage about={courses} shapes={[CoursesShape, Course]}/>,
		"/datasets/documents": <DatasetPage about={documents} shapes={[DocumentsShape, Document]}/>,
		"/datasets/events": <DatasetPage about={events} shapes={[EventsShape, Event]}/>,
		"/datasets/taxonomies": <DatasetPage about={taxonomies} shapes={[TaxonomiesShape, Taxonomy, Topic]}/>,

		"*": <DocumentPage/>

	}}</Routes>;

}
