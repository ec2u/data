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

import { CCBYNCND40, Copyright, datasets } from "@ec2u/data-loader/datasets/index.core.js";
import { base, EC2U } from "@ec2u/data-loader/vocabularies/ec2u.js";
import { immutable } from "@metreeca/core/values";


export const taxonomies = immutable({

	id: `${base}/taxonomies`,

	isDefinedBy: `${base}/datasets/taxonomies`,
	dataset: datasets.id,

	label: "EC2U Taxonomies",

	title: "EC2U Classification Taxonomies",
	alternative: "EC2U Taxonomies",
	description: "Standardised topic taxonomies and other concept schemes for classifying resources.",

	publisher: EC2U,

	rights: Copyright,
	license: [CCBYNCND40]

});
