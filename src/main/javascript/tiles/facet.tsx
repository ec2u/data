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
import { ChevronRight } from "react-feather";
import { NavLink } from "react-router-dom";


export interface Props {

	name: string

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolFacet({

	name

}: Props) {

	return (
		<div className={css`& {
		
			label: tool-facet;
			
			display: grid;
			grid-template-columns: min-content 1fr min-content;
			grid-column-gap: 0.5em;
			align-items: center;
			white-space: nowrap;
			
			*+& {
				margin-top: 1em;
			}
			
			* {
				padding: 0;
				margin: 0;
			}
			
			> button {
				margin-bottom: 0.25rem;
				color: #999;
				transform: rotate(90deg);
			}
			
			> h1 {
				grid-column: span 2;
				margin-bottom: 0.25rem;
				font-weight: 700;
			}
				
			> input {
				justify-self: center;
			}
										
			> small {
				font-size: 66%;
				color: #999;
			}
		
		}`}>

			<button disabled={true}><ChevronRight/></button>
			<h1>{name}</h1>

			<input type="checkbox"/><NavLink to="/structures/">University of Coimbra</NavLink><small>123</small>
			<input type="checkbox"/><NavLink to="/structures/">University of Iasi</NavLink><small>123</small>
			<input type="checkbox"/><NavLink to="/structures/">University of Jena</NavLink><small>123</small>
			<input type="checkbox"/><NavLink to="/structures/">University of Pavia</NavLink><small>123</small>
			<input type="checkbox"/><NavLink to="/structures/">University of Poitiers</NavLink><small>123</small>
			<input type="checkbox"/><NavLink to="/structures/">University of Salamanca</NavLink><small>123</small>
			<input type="checkbox"/><NavLink to="/structures/">University of Turku</NavLink><small>123</small>

		</div>
	);
}
