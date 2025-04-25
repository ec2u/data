/*
 * Copyright © 2020-2025 EC2U Alliance
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

import { Actors, DataActors } from "@ec2u/data/pages/actors/actors";
import { Book, DataBook } from "@ec2u/data/pages/book";
import { Course, DataCourse } from "@ec2u/data/pages/courses/course";
import { Courses, DataCourses } from "@ec2u/data/pages/courses/courses";
import { DataMeta, Dataset } from "@ec2u/data/pages/datasets/dataset";
import { DataDatasets, Datasets } from "@ec2u/data/pages/datasets/datasets";
import { DataDocument, Document } from "@ec2u/data/pages/documents/document";
import { DataDocuments, Documents } from "@ec2u/data/pages/documents/documents";
import { DataEvent, Event } from "@ec2u/data/pages/events/event";
import { DataEvents, Events } from "@ec2u/data/pages/events/events";
import { DataProgram, Program } from "@ec2u/data/pages/programs/program";
import { DataPrograms, Programs } from "@ec2u/data/pages/programs/programs";
import { DataResources, Resources } from "@ec2u/data/pages/resources/resources";
import { DataTaxonomies, Taxonomies } from "@ec2u/data/pages/taxomomies/taxonomies";
import { DataTaxonomy, Taxonomy } from "@ec2u/data/pages/taxomomies/taxonomy";
import { DataTopic, Topic } from "@ec2u/data/pages/taxomomies/topic";
import { DataUnit, Unit } from "@ec2u/data/pages/units/unit";
import { DataUnits, Units } from "@ec2u/data/pages/units/units";
import { DataUniversities, Universities } from "@ec2u/data/pages/universities/universities";
import { DataUniversity, University } from "@ec2u/data/pages/universities/university";
import DataWild, { Wild } from "@ec2u/data/pages/wild";
import { TileContext } from "@metreeca/data/contexts/context";
import { TileRouter } from "@metreeca/data/contexts/router";
import "@metreeca/view/styles/quicksand.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";


createRoot(document.body.firstElementChild!).render(<React.StrictMode>

	<TileContext>

		<TileRouter>{{

			[Datasets.id]: DataDatasets,
			[Resources.id]: DataResources,

			[Universities.id]: DataUniversities,
			[University.id]: DataUniversity,

			[Units.id]: DataUnits,
			[Unit.id]: DataUnit,

			[Programs.id]: DataPrograms,
			[Program.id]: DataProgram,

			[Courses.id]: DataCourses,
			[Course.id]: DataCourse,

			[Documents.id]: DataDocuments,
			[Document.id]: DataDocument,

			[Actors.id]: DataActors,

			[Events.id]: DataEvents,
			[Event.id]: DataEvent,

			[Taxonomies.id]: DataTaxonomies,
			[Taxonomy.id]: DataTaxonomy,
			[Topic.id]: DataTopic,

			[Dataset.id]: DataMeta,
			[Book.id]: DataBook,
			[Wild.id]: DataWild

		}}</TileRouter>

	</TileContext>

</React.StrictMode>);

