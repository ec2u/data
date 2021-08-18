/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { copy } from "@metreeca/tile/nests/router";
import { Calendar, Heart, MapPin } from "@metreeca/tile/tiles/icon";
import { ToolPage as BasePage } from "@metreeca/tile/tiles/page";
import { ToolPane } from "@metreeca/tile/tiles/pane";
import * as React from "react";
import { ReactNode, useState } from "react";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolPage({

	item,
	menu,
	pane,

	children

}: {

	item?: ReactNode
	menu?: ReactNode

	pane?: ReactNode

	children: ReactNode

}) {

	const [hidden, setHidden]=useState(false);

	return <BasePage item={item} menu={menu}

		side={<>
			<a href={"/universities/"}><MapPin/></a>
			<a href={"/events/"}><Calendar/></a>
		</>}

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

		user={<small><a href={"/about"}><Heart/></a></small>}

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


