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

import { Datasets } from "@ec2u/data-shared";
import { Course, Courses } from "@ec2u/data-shared/courses/index.js";
import { Document, Documents } from "@ec2u/data-shared/documents/index.js";
import { Event, Events } from "@ec2u/data-shared/events/index.js";
import { Program, Programs } from "@ec2u/data-shared/programs/index.js";
import { Resources } from "@ec2u/data-shared/resources/index.js";
import { Concept, Taxonomies, Taxonomy } from "@ec2u/data-shared/taxonomies/index.js";
import { Unit, Units } from "@ec2u/data-shared/units/index.js";
import { Universities, University } from "@ec2u/data-shared/universities/index.js";
import type { Endpoints } from "@kxta/tile-api";


/**
 * The routes served by the hub, each mapped to the shape of the resources it serves.
 */
export const endpoints: Endpoints = {

	"/": Datasets,

	"/universities/": Universities,
	"/universities/:code": University,

	"/units/": Units,
	"/units/:code": Unit,

	"/programs/": Programs,
	"/programs/:code": Program,

	"/courses/": Courses,
	"/courses/:code": Course,

	"/documents/": Documents,
	"/documents/:code": Document,

	"/events/": Events,
	"/events/:code": Event,

	"/taxonomies/": Taxonomies,
	"/taxonomies/:taxonomy": Taxonomy,
	"/taxonomies/:taxonomy/*concept": Concept,

	"/resources/": Resources

};
