/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Tag } from "@metreeca/tile/tiles/icon";
import * as React from "react";
import { createElement, ReactNode } from "react";
import "./card.css";

export interface Tags {

	[label: string]: string;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolCard({

	site,
	name,
	icon,

	tags={},

	children

}: {

	site: ReactNode | string
	name?: ReactNode | string
	icon?: ReactNode | string

	tags?: Tags

	children?: ReactNode

}) {

	return createElement("tool-card", {}, <>

		<header>
			<h1>{site}{name}</h1>
			<nav>{Object.entries(tags).map(([label, id]) =>
				<a key={label} href={id}><Tag/>{label}</a>
			)}</nav>
		</header>

		<section>
			{typeof icon === "string" ? <img src={icon}/> : icon}
			<div>{children}</div>
		</section>

	</>);

}
