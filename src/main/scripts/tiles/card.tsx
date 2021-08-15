/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Tag } from "@metreeca/tile/tiles/icon";
import * as React from "react";
import { createElement, ReactNode } from "react";
import "./card.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolCard({

	site,
	name,
	icon,

	tags=[],

	children

}: {

	site: ReactNode | string
	name?: ReactNode | string
	icon?: ReactNode | string

	tags?: string[]

	children?: ReactNode

}) {

	return createElement("tool-card", {}, <>

		<header>
			<h1>{site}{name}</h1>
			<nav>{tags.map(tag => <span key={tag}><Tag/>{tag}</span>)}</nav>
		</header>

		<section>
			{typeof icon === "string" ? <img src={icon}/> : icon}
			<div>{children}</div>
		</section>

	</>);

}
