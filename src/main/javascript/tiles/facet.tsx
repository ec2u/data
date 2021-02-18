/*
 * Copyright © 2021 EC2U Consortium
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

import { h } from "preact";
import { ChevronRight } from "preact-feather";
import { Link } from "preact-router";
import { Custom } from "./custom";
import "./facet.less";

export interface Props {

	name: string

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolFacet({

	name

}: Props) {

	return (
		<Custom tag="tool-facet">

			<button disabled={true}><ChevronRight/></button>
			<h1>{name}</h1>

			<input type="checkbox"/><Link href="/structures/123">University of Coimbra</Link><small>123</small>
			<input type="checkbox"/><Link href="/structures/123">University of Iasi</Link><small>123</small>
			<input type="checkbox"/><Link href="/structures/123">University of Jena</Link><small>123</small>
			<input type="checkbox"/><Link href="/structures/123">University of Pavia</Link><small>123</small>
			<input type="checkbox"/><Link href="/structures/123">University of Poitiers</Link><small>123</small>
			<input type="checkbox"/><Link href="/structures/123">University of Salamanca</Link><small>123</small>
			<input type="checkbox"/><Link href="/structures/123">University of Turku</Link><small>123</small>

		</Custom>
	);
}
