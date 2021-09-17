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

import { RefreshCw } from "./icon";
import "./spin.css";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolSpin({

	icon=<RefreshCw/>,

	size="100%",
	thickness="2.5%",
	color="#999",
	period="1.5s"

}: {

	icon?: ReactNode

	size?: string
	thickness?: string
	color?: string
	period?: string,

}) {

	return createElement("tool-spin", {

		style: {

			"--tool-spin-size": size,
			"--tool-spin-color": color,
			"--tool-spin-period": period,
			"--tool-spin-thickness": thickness

		}

	}, icon);

}
