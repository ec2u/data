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

import { Link } from "@metreeca/clay-widgets/link";
import { opt } from "@metreeca/core";
import type { Lexicon } from "@metreeca/core/resource";
import type { Endpoints } from "./endpoints.core.js";
import { getEndpointAnchor, getEndpointDepth } from "./endpoints.core.js";
import { Listing } from "./index.core.js";
import { getShapeId, getShapeSummary, nameShape } from "./shapes.core.js";
import "./index.css";
import "./endpoints.css";


/**
 * Creates the table of the routes an API serves.
 *
 * Lists each route in mounting order, indented under the routes it extends, beside the model of the resources it
 * serves, linked to its page, and its summary. Each route is anchored, so that shape pages can link to it.
 *
 * @param options The widget configuration
 *
 * @returns The routes table
 */
export function APIEndpoints({

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

	return <Listing routes columns={["endpoint", "shape", "description"]} rows={
																			  Object.entries(endpoints).map(([route, shape]) =>
			                                                                      <tr key={route}>
																					  <td id={getEndpointAnchor(route)}>
																						  <span class={"tile-api-code"} style={{ "--tile-api-index-depth": getEndpointDepth(endpoints, route) }}>{route}</span>
																					  </td>
																					  <td class={"tile-api-index-type"}>{
																						  opt(getShapeId(endpoints, lexicon, shape), href =>
						                                                                      <Link href={href}>{nameShape(shape, lexicon)}</Link>)
																						  ?? nameShape(shape, lexicon)
																					  }</td>
																					  <td>{getShapeSummary(shape)}</td>
																				  </tr>)
																		  }/>;

}
