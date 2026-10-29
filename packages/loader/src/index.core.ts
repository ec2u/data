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

import { bind, executor, service } from "@metreeca/gear";
import { createCache, createFileCache } from "@metreeca/gear/cache";
import { getPackage, getPath } from "@metreeca/gear/space";
import { createVault } from "@metreeca/gear/vault";
import { createFetch } from "@metreeca/http";
import { basic } from "@metreeca/http/basic";
import { cache } from "@metreeca/http/cache";
import { createSPARQLStore } from "@metreeca/keep-sparql";
import { createRDF4JRepository } from "@metreeca/wire-sparql-rdf4j";
import { minute } from "@metreeca/work/core/temporal.js";
import { gcp } from "@metreeca/gear-gcp";
import { createGCPVault } from "@metreeca/gear-gcp/secrets";
import { createGoogleAI } from "@metreeca/llms-google";
import { createStore } from "@metreeca/pipe-store";
import { Metadata as courses } from "./courses/index.core.js";
import { Metadata as datasets } from "./datasets/index.core.js";
import { Metadata as documents } from "./documents/index.core.js";
import { Metadata as events } from "./events/index.core.js";
import { Metadata as organizations } from "./organizations/index.core.js";
import { Metadata as pages } from "./pages/index.core.js";
import { Metadata as persons } from "./persons/index.core.js";
import { Metadata as programs } from "./programs/index.core.js";
import { Metadata as taxonomies } from "./taxonomies/index.core.js";
import { Metadata as units } from "./units/index.core.js";
import { Metadata as universities } from "./universities/index.core.js";


const environment = process.env.PIPE_ENVIRONMENT || "yard"; // !!! align default to branch


export const execute = executor(
	bind(getPath, () => gcp.cloud
		? getPath()
		: getPackage(import.meta.dirname)
	),
	bind(createVault, createGCPVault),
	bind(createCache, () => createFileCache({
		bytes: 1024**3
	})),
	bind(createFetch, () => createFetch(cache({
		ttl: 60*minute,
		store: service(createCache),
		avoid: "https://docs.google.com/**",
		force: "https://www.umu.se/**"
	}))),
	bind(createStore, async () => createSPARQLStore(createRDF4JRepository({
		server: "https://graphdb.ec2u.net",
		repository: `data-${environment}`,
		fetch: createFetch(basic(
			await service(createVault)(`${environment}-gdb-loader-usr`),
			await service(createVault)(`${environment}-gdb-loader-pwd`)
		))
	}))),
	bind(createGoogleAI, async () => createGoogleAI({
		apiKey: await service(createVault)(`${environment}-googleai-key`)
	}))
);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
