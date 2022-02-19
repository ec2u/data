/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import * as React from "react";
import { createElement, ReactNode } from "react";
import "./card.css";


export interface Tags {

	[label: string]: string;

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataCard({

	name,

	tags,
	icon,
	info,

	children

}: {

	name?: ReactNode | string

	tags?: ReactNode | string
	icon?: ReactNode | string
	info?: ReactNode | string

	children?: ReactNode

}) {

	return createElement("data-card", {}, <>

		<div>

			<h1>{name}</h1>

			{children}

		</div>

		<nav>

			<header>{tags}</header>

			<figure>{typeof icon === "string" ? <img src={icon}/> : icon}</figure>

			{info}

		</nav>

	</>);

}
