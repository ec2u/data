/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Custom } from "@metreeca/tile/tiles/custom";
import { ChevronDown, ChevronRight } from "preact-feather";
import { useState } from "preact/hooks";
import "./facet.less";

export interface Props {

	name: string

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolFacet({

	name

}: Props) {

	const [collapsed, setCollapsed]=useState(false);

	return (
		<Custom tag="tool-facet">

			<button onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight/> : <ChevronDown/>}</button>
			<h1>{name}</h1>

			{!collapsed && name === "University" ? <>

				<input type="checkbox"/><a href="/universities/123">University of Coimbra</a><small>123</small>
				<input type="checkbox"/><a href="/universities/123">University of Iasi</a><small>123</small>
				<input type="checkbox"/><a href="/universities/123">University of Jena</a><small>123</small>
				<input type="checkbox"/><a href="/universities/123">University of Pavia</a><small>123</small>
				<input type="checkbox"/><a href="/universities/123">University of Poitiers</a><small>123</small>
				<input type="checkbox"/><a href="/universities/123">University of Salamanca</a><small>123</small>
				<input type="checkbox"/><a href="/universities/123">University of Turku</a><small>123</small>

			</> : <>

				<input type="checkbox"/><a href="/structures/123">Departments</a><small>123</small>
				<input type="checkbox"/><a href="/structures/123">Laboratories</a><small>123</small>
				<input type="checkbox"/><a href="/structures/123">Centers</a><small>123</small>

			</>}

		</Custom>
	);
}
