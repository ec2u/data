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

import { _units } from "@/units/store.js";
import { dump } from "@/_/gear-node/files.js";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";


pipe(
	(items(await _units.select()))
	// (filter(({ formal }) => formal?.includes("Department")))
	(toArray())
).then(dump("work.json"));
