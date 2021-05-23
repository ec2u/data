/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { copy } from "@metreeca/tile/nests/router";
import { Heart } from "@metreeca/tile/tiles/icon";
import { ToolPage as BasePage } from "@metreeca/tile/tiles/page";
import { ToolPane } from "@metreeca/tile/tiles/pane";
import { ComponentChild, ComponentChildren } from "preact";
import { useState } from "preact/hooks";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolPage({

	item,
	menu,
	pane,

	children

}: {

	item?: ComponentChild
	menu?: ComponentChild
	pane?: ComponentChild

	children?: ComponentChildren

}) {

	const [hidden, setHidden]=useState(false);

	return <BasePage item={item} menu={menu} user={<small>
		<a href={"/about"}><Heart/></a>
	</small>}

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

	>{children}</BasePage>;

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


