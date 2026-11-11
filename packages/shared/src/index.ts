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

export * from "./index.core.js"; // ;( ahead of the imports below, which reach back here through import cycles

import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { Resource } from "@ec2u/data-shared/resources/index.js";
import { EuroSciVocTopic } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import { dct } from "@ec2u/data-shared/vocabularies/dct.js";
import { dictionary } from "@metreeca/blue/dictionary";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { date, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { markdown } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import { base, EC2U, ec2u, Entity, licenses } from "./index.core.js";


export const datasets = immutable({

	id: base,

	dataset: base, // the catalogue lists itself among the datasets it publishes

	label: "EC2U Datasets",

	title: { en: "EC2U Dataset Catalogue" },
	alternative: { en: "EC2U Datasets" },
	description: { en: "Descriptions and licensing terms of the datasets published on the EC2U Knowledge Hub." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2022-06-15"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Datasets = State<typeof Datasets>;
export type Dataset = State<typeof Dataset>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Datasets() {
	return resource(Dataset, {

		name: datasets.alternative,
		description: datasets.description

	}, {

		resources: multiple(reference(Dataset))

	});
}

export function Dataset() {
	return resource(Resource, {

		space: dct,
		class: ec2u.Dataset,

		name: "EC2U Dataset",
		description: markdown`
			A dataset published on the EC2U Knowledge Hub.

			> [!IMPORTANT]
			> Not intended for use in isolation: it factors the properties shared by the specialised dataset models.
		`

	}, {

		title: required(dictionary({ uniqueLang: true }), {
			description: "Formal title of the dataset."
		}),

		alternative: optional(dictionary({ uniqueLang: true }), {
			description: "Short title the dataset is also known by."
		}),

		description: required(dictionary({ uniqueLang: true }), {
			description: "Account of the content of the dataset."
		}),

		created: optional(date, {
			description: "Date of creation of the dataset."
		}),

		issued: optional(date, {
			description: "Date of formal issuance of the dataset."
		}),

		modified: optional(date, {
			description: "Date of the latest modification of the dataset."
		}),

		publisher: optional(reference(Organization), {
			description: "Organization responsible for making the dataset available."
		}),

		source: optional(reference(Entity), {
			description: "Resource the dataset is derived from."
		}),

		rights: optional(text, {
			description: "Statement of the rights held over the dataset."
		}),

		license: multiple(reference(Entity), {
			description: "Legal documents granting permission to use the dataset."
		}),

		accessRights: optional(dictionary({ uniqueLang: true }), {
			description: "Statement of who may access the dataset and under which conditions."
		}),

		subject: multiple(reference(EuroSciVocTopic), {
			description: markdown`
				Topics the dataset is about.

				Drawn from the [EuroSciVoc](/taxonomies/euroscivoc/) taxonomy.
			`
		}),

		resources: multiple(reference(Resource), {

			foreign: true,

			reverse: ec2u.dataset,

			description: "Resources published in the dataset."

		})

	});
}
