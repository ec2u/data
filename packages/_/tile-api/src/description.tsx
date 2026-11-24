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

import { Markdown } from "@grafctory/clay-markdown/markdown";
import { opt } from "@grafctory/core";
import type { Lexicon } from "@grafctory/core/resource";
import type { Endpoints } from "./endpoints.core.js";
import { getShape, getShapeDescription } from "./shapes.core.js";


/**
 * Creates the description of a resource shape.
 *
 * Sets out the English description the shape states, as markdown; sets out nothing if the shape states none in English
 * or if no shape of the model carries the given identifier.
 *
 * @param options The widget configuration
 *
 * @returns The shape description
 */
export function ShapeDescription({

	id,
	endpoints,
	lexicon

}: {

	/**
	 * The identifier of the shape to be described, as the last step of the route of its documentation page.
	 */
	id: string

	/**
	 * The routes served by the API, each mapped to the shape of the resources it serves.
	 */
	endpoints: Endpoints

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

}) {
	return opt(getShape(endpoints, lexicon, id), shape =>
		opt(getShapeDescription(shape), description => <Markdown>{description}</Markdown>)
	) ?? null;
}
