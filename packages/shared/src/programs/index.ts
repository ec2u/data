/*
 * Copyright © 2025-2026 Metreeca srl
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

import { CCBYNCND40, Copyright, datasets } from "@ec2u/data-shared/datasets/index.core.js";
import { Offering } from "@ec2u/data-shared/offerings/index.js";
import { EC2U, base, ec2u } from "@ec2u/data-shared";
import { SchemaEducationalOccupationalProgram } from "@ec2u/data-shared/vocabularies/schema/learning.js";
import { resource } from "@metreeca/blue/resource";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const programs = immutable({

	id: resolve(base, "/programs/"),

	isDefinedBy: resolve(base, "/datasets/programs"),
	dataset: datasets.id,

	label: "EC2U Programs",

	title: "EC2U Degree and Occupational Programs",
	alternative: "EC2U Programs",
	description: "Formal degree and vocational qualification programs offered by EC2U partner universities.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40],

	issued: "2022-03-10"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Program() {
	return resource(Offering, SchemaEducationalOccupationalProgram, {

		space: ec2u,
		class: ec2u.Program

	}, {});
}
