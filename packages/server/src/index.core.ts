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
import { createVault } from "@metreeca/gear/vault";
import { createFetch } from "@metreeca/http";
import { basic } from "@metreeca/http/basic";
import { createSPARQLStore } from "@metreeca/keep-sparql";
import { createRDF4JRepository } from "@metreeca/wire-sparql-rdf4j";
import { createGCPVault } from "@metreeca/work/gear-gcp/secrets.js";
import { createStore } from "@metreeca/work/pipe-store/index.js";


export const execute = executor(
	bind(createVault, createGCPVault),
	bind(createStore, async () => createSPARQLStore(createRDF4JRepository({ // !!! factor with loader
		server: "https://graphdb.ec2u.net",
		repository: "data-work",
		fetch: createFetch(basic(
			await service(createVault)("gdb-server-usr"),
			await service(createVault)("gdb-server-pwd")
		))
	})))
);
