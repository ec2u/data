/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { useProp } from "@metreeca/tool/hooks/prop";
import { ToolPage } from "@metreeca/tool/tiles/page";
import * as React from "react";
import { ReactNode } from "react";
import { Home } from "../pages/home";
import { DataResourcesPane } from "../panes/resources";


const ResourcesPane: ReactNode=<DataResourcesPane/>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataPage({

	item,
	menu,

	side,
	pane,

	children

}: {

	item?: ReactNode
	menu?: ReactNode

	side?: ReactNode
	pane?: ReactNode

	children: ReactNode

}) {

	const [active, setActive]=useProp(pane || ResourcesPane); // ;( use constant to avoid infinite useEffect loops

	return <ToolPage

		item={<><a href={Home.id}>EC2U</a> {typeof item === "string" ? <span>{item}</span> : item}</>}

		menu={menu}

		// side={<><DataResourcesButton onClick={setActive}/> {side}</>}

		// pane={active}

	>

		{children}

	</ToolPage>;

}


