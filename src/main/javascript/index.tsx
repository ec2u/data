/*
 * Copyright © 2020-2024 EC2U Alliance
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
import { Concept, DataConcept } from "@ec2u/data/pages/concepts/concept";
import { DataScheme, Scheme } from "@ec2u/data/pages/concepts/scheme";
import { DataSchemes, Schemes } from "@ec2u/data/pages/concepts/schemes";
import { Course, DataCourse } from "@ec2u/data/pages/courses/course";
import { Courses, DataCourses } from "@ec2u/data/pages/courses/courses";
import { DataDataset, Dataset } from "@ec2u/data/pages/datasets/dataset";
import { DataDatasets, Datasets } from "@ec2u/data/pages/datasets/datasets";
import { DataEvent, Event } from "@ec2u/data/pages/events/event";
import { DataEvents, Events } from "@ec2u/data/pages/events/events";
import { DataProgram, Program } from "@ec2u/data/pages/programs/program";
import { DataPrograms, Programs } from "@ec2u/data/pages/programs/programs";
import { DataUnit, Unit } from "@ec2u/data/pages/units/unit";
import { DataUnits, Units } from "@ec2u/data/pages/units/units";
import { DataUniversities, Universities } from "@ec2u/data/pages/universities/universities";
import { DataUniversity, University } from "@ec2u/data/pages/universities/university";
import DataWild, { Wild } from "@ec2u/data/pages/wild";
import { ToolContext } from "@metreeca/data/contexts/context";
import { ToolRouter } from "@metreeca/data/contexts/router";
import "@metreeca/view/styles/quicksand.css";
import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";


createRoot(document.body.firstElementChild!).render((

	<React.StrictMode>

		<ToolContext>

			<ToolRouter>{{

				[Datasets.id]: DataDatasets,
				[Dataset.id]: DataDataset,

				[Universities.id]: DataUniversities,
				[(University.id)]: DataUniversity,

				[Units.id]: DataUnits,
				[Unit.id]: DataUnit,

				[Programs.id]: DataPrograms,
				[Program.id]: DataProgram,

				[Courses.id]: DataCourses,
				[Course.id]: DataCourse,

				// [Documents.id]: DataDocuments,
				// [Document.id]: DataDocument,

				[Actors.id]: DataActors,

				[Events.id]: DataEvents,
				[Event.id]: DataEvent,

				[Schemes.id]: DataSchemes,
				[Scheme.id]: DataScheme,
				[Concept.id]: DataConcept,

				[Wild.id]: DataWild

			}}</ToolRouter>

		</ToolContext>

	</React.StrictMode>

));

