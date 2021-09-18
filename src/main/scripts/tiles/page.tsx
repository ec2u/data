/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { ReactNode, useEffect, useState } from "react";
import { ToolPage } from "../@metreeca/tool/tiles/page";
import { Home } from "../pages/home";
import { DataResourcesButton, DataResourcesPane } from "../panes/resources";

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

	const [active, setActive]=useState<ReactNode>();

	useEffect(() => { setActive(pane || <DataResourcesPane/>); }, [pane]);

	return <ToolPage

		item={<><a href={Home.id}>EC2U</a> {typeof item === "string" ? <span>{item}</span> : item}</>}

		menu={menu}

		side={<><DataResourcesButton onClick={setActive}/> {side}</>}

		pane={active}

	>

		{children}

	</ToolPage>;

}


