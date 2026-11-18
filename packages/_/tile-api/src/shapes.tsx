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

import type { Lexicon } from "@metreeca/core/resource";
import type { Endpoints } from "./endpoints.core.js";
import { Models } from "./index.core.js";
import { getModelHierarchy } from "./shapes.core.js";


/**
 * Creates the table of the resource types of the model of an API, each nested under the types it extends.
 *
 * @param options The widget configuration
 *
 * @returns The resources table, each type linked to its page beside its summary
 */
export function APIShapes({

	endpoints,
	lexicon

}: {

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

}) {
	return <Models endpoints={endpoints} lexicon={lexicon} rows={getModelHierarchy(endpoints, lexicon)}/>;
}
