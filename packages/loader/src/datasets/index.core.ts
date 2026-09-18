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

import { EC2U, base } from "@ec2u/data-loader/vocabularies/ec2u.js";
import { immutable } from "@metreeca/core/values";


// standalone from the shape module, so that a dataset defined alongside a shape doesn't have to import it back

export const Copyright = "Copyright © 2022-2025 EC2U Alliance";
export const CCBYNCND40 = "https://creativecommons.org/licenses/by-nc-nd/4.0/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const Catalogue = `${base}/`;

export const datasets = immutable({

	id: Catalogue,

	isDefinedBy: `${base}/datasets/`,
	dataset: Catalogue, // the catalogue lists itself among the datasets it publishes


	label: "EC2U Datasets",

	title: "EC2U Dataset Catalog",
	alternative: "EC2U Datasets",
	description: "Datasets published on the EC2U Knowledge Hub.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40]

});
