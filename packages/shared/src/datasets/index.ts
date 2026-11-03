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

import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { EuroSciVocTopic } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import { Resource } from "@ec2u/data-shared/resources/index.js";
import { dct } from "@ec2u/data-shared/vocabularies/dct.js";
import { base, EC2U, ec2u, Entity, licenses } from "@ec2u/data-shared";
import { dictionary } from "@metreeca/blue/dictionary";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { date, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const datasets = immutable({

	id: base,

	isDefinedBy: resolve(base, "/datasets/"),
	dataset: base, // the catalogue lists itself among the datasets it publishes


	label: "EC2U Knowledge Hub",

	title: { en: "EC2U Knowledge Hub" },
	alternative: { en: "EC2U Datasets" },
	description: { en: "Catalogue of the datasets published by the EC2U Alliance on the EC2U Knowledge Hub." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id]

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Datasets = State<typeof Datasets>;
export type Dataset = State<typeof Dataset>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Datasets() {
	return resource(Dataset, {

		name: "Datasets",
		description: "Datasets published on the EC2U Knowledge Hub."

	}, {

		resources: multiple(reference(Dataset))

	});
}

export function Dataset() {
	return resource(Resource, {

		space: dct,
		class: ec2u.Dataset,

		name: "Dataset",
		description: "A dataset published on the EC2U Knowledge Hub."

	}, {

		title: required(dictionary({ uniqueLang: true })),
		alternative: optional(dictionary({ uniqueLang: true })),
		description: required(dictionary({ uniqueLang: true })),

		created: optional(date),
		issued: optional(date),
		modified: optional(date),

		publisher: optional(reference(Organization)),

		source: optional(reference(Entity)),

		rights: optional(text),
		license: multiple(reference(Entity)),
		accessRights: optional(dictionary({ uniqueLang: true })),

		subject: multiple(reference(EuroSciVocTopic)),

		resources: multiple(reference(Resource), {

			foreign: true,

			reverse: ec2u.dataset

		})

	});
}
