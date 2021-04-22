/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { label } from "@metreeca/tile/graphs";
import { useTerms } from "@metreeca/tile/hooks/entry";
import { Custom } from "@metreeca/tile/tiles/custom";
import { X } from "@metreeca/tile/tiles/icon";
import { ToolOptions } from "@metreeca/tile/tiles/options";
import { ChevronDown, ChevronRight, RefreshCw } from "preact-feather";
import { useState } from "preact/hooks";
import "./facet.less";

export interface Props {

	id?: string,
	path: string,

	name?: string,

	query: [{ [key: string]: any }, (delta: Partial<{ [key: string]: any }>) => void]


}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolFacet({

	id="",
	path,

	name="",

	query: [query, putQuery]

}: Props) {

	const [collapsed, setCollapsed]=useState(false);
	const options=useTerms(id, path, query);

	return (
		<Custom tag="tool-facet">

			<header>

				<button onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight/> : <ChevronDown/>}</button>

				<h1>{name || label(id)}</h1>

				{options.then(value =>

					<button disabled={!query[path]?.length} onClick={() => putQuery({ [path]: [] })}><X/></button>
				) || <button disabled={true} className={"spinning"}><RefreshCw/></button>}

			</header>

			{!collapsed && <ToolOptions id={id} path={path} state={[query, putQuery]}/>}

		</Custom>
	);
}
