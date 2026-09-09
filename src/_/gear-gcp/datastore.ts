/*
 * Copyright © 2026 Metreeca srl
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

/**
 * Google Cloud Datastore integration.
 *
 * Provides {@link datastore}, a shared entity store client, alongside the {@link PropertyFilter} and {@link or} query
 * filter builders re-exported from the underlying client library.
 *
 * @module
 *
 * @see {@link https://cloud.google.com/nodejs/docs/reference/datastore/latest Datastore Node.js Client}
 */

import { Datastore, or, PropertyFilter } from "@google-cloud/datastore";

export { PropertyFilter, or };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * The shared Google Cloud Datastore client.
 *
 * Operates on the datastore of the project the process is authenticated against, as discovered by the client at
 * construction time from the ambient Google Cloud credentials.
 */
export const datastore = new Datastore();
