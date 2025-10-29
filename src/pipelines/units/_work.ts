/*
 * Copyright © 2025 Metreeca srl
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
import { filter, forEach, items, pipe } from "@metreeca/pipe";

pipe(
	items(units.select({ updated: 0 }))
	(filter(u => u.parent === "https://data.ec2u.eu/units/736ca4af-03c3-4fde-af86-bd8852edc9bd"))
	(forEach(console.log))
);
