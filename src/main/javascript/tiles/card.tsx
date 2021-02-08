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
import { Tag } from "react-feather";


export interface Props {

	site: JSX.Element | string
	name: JSX.Element | string

	tags?: (JSX.Element | string)[]

	children?: React.ReactNode

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export default function ToolCard({

	site,
	name,

	tags=[],

	children

}: Props) {

	return (
		<div className={css`& {
		
			label: tool-card;
			
			display: flex;
			flex-direction: column;
			align-items: stretch;
			
			*+& {
				margin-top: 1em;
			}
			
			> header {
			
				display: flex;
				flex-direction: row;
				align-items: center;
				
				> h1 {
				
					font-weight: 700;
												
					> *+*::before {
						content: '›';
						margin: 0 0.25em;
					}

				}
					
				> nav {
				
					margin-left: auto;
					font-size: 75%;
					
					> * {
						
						display: inline-flex;
						flex-direction: row;
						align-items: center;
						
						padding: 0.25em 0.75em;
						border-style: solid;
						border-radius: 1em;
						background-color: #F4F5F6;
						
						margin-left: 0.25em;
						
						> svg {
							width: 1em;
							height: 1em;
							margin-right: 0.25em;
							stroke: #333;
						}
						
					}
					
				}

			}
			
			> section {
				margin-top: 0.25em;
				font-size: 90%;
			}
			
		}`}>

			<header>
				<h1>{site}{name}</h1>
				<nav>{tags.map(tag => <span><Tag/>{tag}</span>)}</nav>
			</header>

			<section>{children}</section>

		</div>
	);
}
