/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { ReactNode, useState } from "react";
import { ToolPage } from "../@metreeca/tool/tiles/page";
import { ToolResources } from "../panes/resources";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataPage({

	pane,

	item,
	menu,

	children

}: {

	item?: ReactNode
	menu?: ReactNode

	pane?: ReactNode

	children: ReactNode

}) {

	const [hidden, setHidden]=useState(false);

	return <ToolPage item={[<
		a href={"https://ec2u.eu/"}>EC2U</a>,
		typeof item === "string" ? <span>{item}</span> : item
	]}

		menu={menu}

		pane={<ToolResources/>}

		/*
		 pane={<ToolPane

		 header={<a href={"/"} onClick={e => {

		 if ( e.shiftKey ) {

		 e.preventDefault();
		 setHidden(!hidden);

		 }

		 }}><strong>EC2U Connect Centre</strong></a>}

		 footer={<small>{copy}</small>}

		 >{

		 hidden ? <Hidden/> : pane

		 }</ToolPane>}
		 */

	>{children}</ToolPage>;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Hidden() {
	return (
		<ul>
			<li><a href="/ewp/" target={"_blank"}>EWP APIs</a></li>
			<li><a href="/sparql" target={"_blank"}>SPARQL</a></li>
		</ul>
	);
}


