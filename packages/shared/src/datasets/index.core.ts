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

import { base, EC2U } from "@ec2u/data-shared";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


export const licenses = immutable({

	CCBYNCND40: {

		id: "https://creativecommons.org/licenses/by-nc-nd/4.0/",

		label: "CC BY-NC-ND 4.0",
		comment: { en: "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International" }

	}

});

export const datasets = immutable({

	id: base,

	isDefinedBy: resolve(base, "/datasets/"),
	dataset: base, // the catalogue lists itself among the datasets it publishes


	label: "EC2U Datasets",

	title: { en: "EC2U Dataset Catalog" },
	alternative: { en: "EC2U Datasets" },
	description: { en: "Datasets published on the EC2U Knowledge Hub." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id]

});
