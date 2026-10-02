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

import { Metadata as courses } from "./courses/index.core.js";
import { Metadata as datasets } from "./datasets/index.core.js";
import { Metadata as documents } from "./documents/index.core.js";
import { Metadata as events } from "./events/index.core.js";
import { execute } from "@ec2u/data-system";
import { Metadata as organizations } from "./organizations/index.core.js";
import { Metadata as pages } from "./pages/index.core.js";
import { Metadata as persons } from "./persons/index.core.js";
import { Metadata as programs } from "./programs/index.core.js";
import { Metadata as taxonomies } from "./taxonomies/index.meta.js";
import { Metadata as units } from "./units/index.core.js";
import { Metadata as universities } from "./universities/index.core.js";


if ( import.meta.main ) {
	await execute(() => Promise.all([
		datasets(),
		organizations(),
		persons(),
		universities(),
		units(),
		programs(),
		courses(),
		documents(),
		events(),
		taxonomies(),
		pages()
	]));
}
