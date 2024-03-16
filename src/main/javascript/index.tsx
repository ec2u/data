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
import { DataDataset, Dataset } from "@ec2u/data/pages/datasets/dataset";
import { DataDatasets, Datasets } from "@ec2u/data/pages/datasets/datasets";
import { DataEvent, Event } from "@ec2u/data/pages/events/event";
import { DataEvents, Events } from "@ec2u/data/pages/events/events";
import { DataPrograms, Programs } from "@ec2u/data/pages/programs/programs";
import { DataUnit, Unit } from "@ec2u/data/pages/units/unit";
import { DataUnits, Units } from "@ec2u/data/pages/units/units";
import { DataUniversities, Universities } from "@ec2u/data/pages/universities/universities";
import { DataUniversity, University } from "@ec2u/data/pages/universities/university";
import DataWild, { Wild } from "@ec2u/data/pages/wild";
import { id } from "@metreeca/core/entry";
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

				[id(Datasets)]: DataDatasets,
				[id(Dataset)]: DataDataset,

				[id(Universities)]: DataUniversities,
				[(id(University))]: DataUniversity,

				[id(Units)]: DataUnits,
				[id(Unit)]: DataUnit,

				[id(Programs)]: DataPrograms,
				// [Program.id]: DataProgram,

				// [Courses.id]: DataCourses,
				// [Course.id]: DataCourse,

				// [Documents.id]: DataDocuments,
				// [Document.id]: DataDocument,

				[id(Actors)]: DataActors,

				[id(Events)]: DataEvents,
				[id(Event)]: DataEvent,

				[id(Schemes)]: DataSchemes,
				[id(Scheme)]: DataScheme,
				[id(Concept)]: DataConcept,

				[id(Wild)]: DataWild

			}}</ToolRouter>

		</ToolContext>

	</React.StrictMode>

));

