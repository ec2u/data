/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Fragment, h } from "preact";
import { ChevronDown, ChevronRight } from "preact-feather";
import { Link } from "preact-router";
import { useState } from "preact/hooks";
import { Custom } from "./custom";
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

			{!collapsed && <Fragment>

				<input type="checkbox"/><Link href="/structures/123">University of Coimbra</Link><small>123</small>
				<input type="checkbox"/><Link href="/structures/123">University of Iasi</Link><small>123</small>
				<input type="checkbox"/><Link href="/structures/123">University of Jena</Link><small>123</small>
				<input type="checkbox"/><Link href="/structures/123">University of Pavia</Link><small>123</small>
				<input type="checkbox"/><Link href="/structures/123">University of Poitiers</Link><small>123</small>
				<input type="checkbox"/><Link href="/structures/123">University of Salamanca</Link><small>123</small>
				<input type="checkbox"/><Link href="/structures/123">University of Turku</Link><small>123</small>

			</Fragment>}

		</Custom>
	);
}
