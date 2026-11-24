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

import { Link } from "@grafctory/clay-widgets/link";
import type { Lexicon } from "@grafctory/core/resource";
import { Listing } from "./index.core.js";
import "./index.css";


/**
 * Creates the table of the prefixes abbreviating the IRIs of the model of an API, with their namespaces.
 *
 * @param options The widget configuration
 *
 * @returns The prefixes table; empty, apart from its column headings, if the lexicon states no prefix
 */
export function APIPrefixes({

	lexicon

}: {

	/**
	 * The prefixes abbreviating the IRIs of the model.
	 */
	lexicon: Lexicon

}) {
	return <Listing columns={["prefix", "namespace"]} rows={
														  Object.entries(lexicon).map(([prefix, namespace]) =>
			                                                  <tr key={prefix}>
																  <td><span class={"tile-api-code"}>{prefix}</span></td>
																  <td>
					                                                  <Link href={namespace[""]}><span class={"tile-api-code"}>{namespace[""]}</span></Link>
				                                                  </td>
															  </tr>)
													  }/>;
}
