/*
 * Copyright © 2020-2022 EC2U Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
