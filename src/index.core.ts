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

import { minute } from "@/_/core/temporal.js";
import { gcp } from "@/_/gear-gcp/index.js";
import { createGCPVault } from "@/_/gear-gcp/secrets.js";
import { createStore } from "@/_/gear-store/index.js";
import { createMockStore } from "@/_/gear-store/_mock.js";
import { createGoogleAI } from "@/_/muse-google/index.js";
import { createOpenAI } from "@/_/muse-openai/index.js";
import { bind, executor, service } from "@metreeca/gear";
import { createCache, createFileCache } from "@metreeca/gear/cache";
import { getPackage, getPath } from "@metreeca/gear/space";
import { createVault } from "@metreeca/gear/vault";
import { createFetch } from "@metreeca/http";
import { cache } from "@metreeca/http/cache";

export const execute = executor(
	bind(getPath, () => gcp.production
		? getPath()
		: getPackage(import.meta.dirname)
	),
	bind(createVault, createGCPVault),
	bind(createCache, () => createFileCache({
		bytes: 1024**3
	})),
	bind(createFetch, () => createFetch(cache({
		ttl: 60*minute,
		store: service(createCache)
	}))),
	bind(createStore, createMockStore), // !!! bind the connector the deployment targets
	bind(createGoogleAI, async () => createGoogleAI({
		apiKey: await service(createVault)("googleai-key")
	}))
);
