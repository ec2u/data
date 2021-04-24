/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Custom } from "@metreeca/tile/tiles/custom";
import { Tag } from "@metreeca/tile/tiles/icon";
import { ComponentChildren, JSX } from "preact";
import "./card.css";


export interface Props {

	site: JSX.Element | string
	name?: JSX.Element | string
	icon?: (JSX.Element | string)

	tags?: (JSX.Element | string)[]

	children?: ComponentChildren

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolCard({

	site,
	name,
	icon,

	tags=[],

	children

}: Props) {

	return (
		<Custom tag="tool-card">

			<header>
				<h1>{site}{name}</h1>
				<nav>{tags.map(tag => <span><Tag/>{tag}</span>)}</nav>
			</header>

			<section>
				{typeof icon === "string" ? <img src={icon}/> : icon}
				<div>{children}</div>
			</section>

		</Custom>
	);
}
