/*
 * Copyright © 2020-2023 EC2U Alliance
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

import { Actors, DataActors } from "@ec2u/data/pages/actors";
import { Concept, DataConcept } from "@ec2u/data/pages/concepts/concept";
import { DataScheme, Scheme } from "@ec2u/data/pages/concepts/scheme";
import { DataSchemes, Schemes } from "@ec2u/data/pages/concepts/schemes";
import { Course, DataCourse } from "@ec2u/data/pages/courses/course";
import { Courses, DataCourses } from "@ec2u/data/pages/courses/courses";
import { DataDataset, Dataset } from "@ec2u/data/pages/datasets/dataset";
import { DataDatasets, Datasets } from "@ec2u/data/pages/datasets/datasets";
import { DataDocument, Document } from "@ec2u/data/pages/documents/document";
import { DataDocuments, Documents } from "@ec2u/data/pages/documents/documents";
import { DataEvent, Event } from "@ec2u/data/pages/events/event";
import { DataEvents, Events } from "@ec2u/data/pages/events/events";
import DataNone from "@ec2u/data/pages/none";
import { DataProgram, Program } from "@ec2u/data/pages/programs/program";
import { DataPrograms, Programs } from "@ec2u/data/pages/programs/programs";
import { DataUnit, Unit } from "@ec2u/data/pages/units/unit";
import { DataUnits, Units } from "@ec2u/data/pages/units/units";
import { DataUniversities, Universities } from "@ec2u/data/pages/universities/universities";
import { DataUniversity, University } from "@ec2u/data/pages/universities/university";
import "@metreeca/view/index.css";
import { NodeFetcher } from "@metreeca/view/nests/fetcher";
import { NodeGraph } from "@metreeca/view/nests/graph";
import { NodeRouter } from "@metreeca/view/nests/router";
import "@metreeca/view/skins/quicksand.css";
import * as React from "react";
import { render } from "react-dom";
import "./index.css";


render((

    <React.StrictMode>

        <NodeFetcher fetcher={(input, init) => {

            const headers=new Headers(init?.headers || {});

            const tags=navigator.languages;
            const size=tags.length+1;

            headers.set("Accept", "application/json");
            headers.set("Accept-Language", [

                ...tags.map((tag, index) => `${tag};q=${((size-index)/size).toFixed(1)}`),

                `*;q=${(1/size).toFixed(1)}`

            ].join(", "));

            return fetch(input, { ...init, headers });

        }}>

            <NodeGraph>

                <NodeRouter>{{

                    [Datasets.id]: DataDatasets,

                    // !!! to be reviewed after metreeca/java supports resource access to collections

                    [Dataset.id.replace(/\/[^/]*$/, "")]: DataDataset,
                    [Dataset.id]: DataDataset,

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

                    [Schemes.id]: DataSchemes,
                    [Scheme.id]: DataScheme,
                    [Concept.id]: DataConcept,

                    "*": DataNone

                }}</NodeRouter>

            </NodeGraph>

        </NodeFetcher>

    </React.StrictMode>

), document.body.firstElementChild);
