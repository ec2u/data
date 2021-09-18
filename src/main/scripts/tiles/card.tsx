/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { createElement, ReactNode } from "react";
import { Tag } from "../@metreeca/tool/tiles/icon";
import "./card.css";

export interface Tags {

	[label: string]: string;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataCard({

	name,

	icon,
	tags={},

	children

}: {

	name: ReactNode | string

	icon?: ReactNode | string
	tags?: Tags

	children?: ReactNode

}) {

	return createElement("data-card", {}, <>

		<header>

			<h1>{name}</h1>

			<nav>{Object.entries(tags).map(([label, id]) =>
				<a key={label} href={id}><Tag/>{label}</a>
			)}</nav>

		</header>

		<section>

			{typeof icon === "string" ? <img src={icon}/> : icon}
			{children}

		</section>

	</>);

}
