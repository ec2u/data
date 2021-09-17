/*
 * Copyright © 2020-2021 Metreeca srl
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
import "./item.css";

export function ToolItem({

	icon,
	name,
	menu

}: {

	icon?: ReactNode
	name: ReactNode | string
	menu?: ReactNode

}) {

	return createElement("tool-item", {}, <>

		<nav>{icon}</nav>

		<span>{name}</span>

		<nav>{menu}</nav>

	</>);
}