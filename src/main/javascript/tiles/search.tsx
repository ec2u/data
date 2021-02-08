/*
 * Copyright © 2021-2021 EC2U Consortium
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
import { ArrowRightCircle, Search } from "react-feather";


export interface Props {

	placeholder?: string

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolSearch({

	placeholder=""

}: Props) {

	return (
		<div className={css`& {

			label: tool-search;
			
			--tool-search-width-side: 1.75em;
			
			display: grid;
			grid-template-columns: var(--tool-search-width-side) 1fr var(--tool-search-width-side);
			grid-template-rows: min-content;
			align-items: center;
			
			> * {
				grid-row: 1;    
			}
					
            > input {
			    grid-column: 1 / span 3;
				padding: 0.3em var(--tool-search-width-side) 0.2em;
				border-style: solid;
				border-radius: 1em;
				font-weight: 300;
			}
		
			 > :first-child,
			 > :last-child {
				z-index: 1;
				color: #999;
				background-color: transparent;
			}
		
			> :first-child {
				grid-column: 1;
			}
		
			> :last-child {
				grid-column: 3;
			}
		
		}`}>

			<button><Search/></button>
			<input autoFocus={true} type="text" placeholder={placeholder}/>
			<button><ArrowRightCircle/></button>

		</div>
	);
}
