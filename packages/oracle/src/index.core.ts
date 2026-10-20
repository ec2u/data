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
import { createHTTPRepository } from "@metreeca/wire-sparql-http";
import { createGCPVault } from "@metreeca/gear-gcp/secrets";
import { createGoogleAI } from "@metreeca/llms-google";
import { createStore } from "@metreeca/pipe-store";


const environment = process.env.PIPE_ENVIRONMENT || "yard"; // !!! align default to branch


export const execute = executor(
	bind(createVault, createGCPVault),
	bind(createStore, async () => createSPARQLStore(createHTTPRepository({ // no transactions for read-only users
		query: `https://graphdb.ec2u.net/repositories/data-${environment}`,
		fetch: createFetch(basic(
			await service(createVault)(`${environment}-gdb-oracle-usr`),
			await service(createVault)(`${environment}-gdb-oracle-pwd`)
		))
	}))),
	bind(createGoogleAI, async () => createGoogleAI({
		apiKey: await service(createVault)(`${environment}-googleai-key`)
	}))
);
