/*
 * Copyright © 2020-2025 EC2U Alliance
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


import { units } from "@/pipelines/units/store";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { forEach } from "@metreeca/flow/sinks";
import { filter, peek } from "@metreeca/flow/tasks";

units.remove();

const numberPromise = pipe(
	(items(units.select()))
	(filter(u => !u.university || !u.parent))
	(peek(console.info))
	(forEach(units.remove))
		.then(console.info)
);
