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

import { units } from "@/datasets/units/store.js";
import { dump } from "@/_/node/files.js";
import { pipe } from "@metreeca/pipe";
import { items } from "@metreeca/pipe/feeds";
import { toArray } from "@metreeca/pipe/sinks";


pipe(
	(items(units.select()))
	// (filter(({ formal }) => formal?.includes("Department")))
	(toArray())
).then(dump("work.json"));
