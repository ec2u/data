/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { ComponentChildren, h, JSX } from "preact";
import { Tag } from "preact-feather";
import "./card.less";
import { Custom } from "./custom";


export interface Props {

	site: JSX.Element | string
	name: JSX.Element | string

	tags?: (JSX.Element | string)[]

	children?: ComponentChildren

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolCard({

	site,
	name,

	tags=[],

	children

}: Props) {

	return (
		<Custom tag="tool-card">

			<header>
				<h1>{site}{name}</h1>
				<nav>{tags.map(tag => <span><Tag/>{tag}</span>)}</nav>
			</header>

			<section>{children}</section>

		</Custom>
	);
}
