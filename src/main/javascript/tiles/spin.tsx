/*
 * Copyright © 2021 EC2U Consortium
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

import { css } from "emotion";
import React from "react";
import { RefreshCw } from "react-feather";

export interface Props {

	size?: string
	color?: string
	period?: string

}

export default function ToolSpin({

	size="1em",
	color="#999",
	period="1.5s"

}: Props) {

	return (
		<div className={css`& {
		
			display: grid;
			width: 100%;
			height: 100%;
		
			> svg {
				width: var(--tool-spin-size);
				height: var(--tool-spin-size);
				margin: auto;
				stroke: var(--tool-spin-color);
				stroke-width: 1;
				animation: spin var(--tool-spin-period) infinite linear;
			}
		
			@keyframes spin { 100% { transform:rotate(360deg); } }

		}`}>

			<RefreshCw style={{ // @ts-ignore

				"--tool-spin-size": size,
				"--tool-spin-color": color,
				"--tool-spin-period": period

			}}/>

		</div>
	);
}
