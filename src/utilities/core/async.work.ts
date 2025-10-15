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

import { collect, filter, forEach, map, pipe, process, reduce } from "./async";

await process(pipe([1, 2, 3])
	(map(v => v*v))
	(filter(v => v > 2))
	(forEach(console.info))
);

console.log(await collect(pipe([1, 2, 3, 4, 5])
	(filter(n => n > 2))
	(map(n => n*2))
	(reduce((acc, n) => acc+n, 0))
));
