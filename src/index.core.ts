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

import { gcp } from "@/_/gcp/index.js";
import { bind, executor, service } from "@metreeca/flow";
import { createCache, createFileCache } from "@metreeca/flow/cache";
import { getPackage, getPath } from "@metreeca/flow/space";
import { createVault } from "@metreeca/flow/vault";
import { createFetch } from "@metreeca/http";
import { cache } from "@metreeca/http/cache";
import { monitor } from "@metreeca/http/monitor";
import { log } from "@metreeca/tape";
import { createGCPVault } from "./_/gcp/secrets.js";


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const execute = executor(
	bind(getPath, () => gcp.production
		? getPath()
		: getPackage(import.meta.dirname)
	),
	bind(createVault, createGCPVault),
	bind(createCache, () => createFileCache({
		bytes: 1024**3
	})),
	bind(createFetch, () => createFetch(
		monitor(logger),
		cache({ store: service(createCache) })
	))
);
