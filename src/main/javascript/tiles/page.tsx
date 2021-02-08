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
import { Heart, LogIn } from "react-feather";

const title=document.title;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Props {

	disabled?: boolean

	name?: JSX.Element | string
	menu?: JSX.Element
	side?: JSX.Element

	children?: React.ReactNode

}

export default function ToolPage({

	disabled=false,

	name,
	menu,
	side,

	children

}: Props) {

	return (
		<div className={css`& {
		
			label: tool-page;
			
			width: 100%;
			height: 100%;
			
			display: grid;
			grid-template-areas: "home head" "side main";
			grid-template-columns: 15rem 1fr;
			grid-template-rows: min-content 1fr;
			
			> * {
				overflow: hidden;
			}
			
			.home,
			.head {
			
				display: flex;
				flex-direction: row;
				align-items: center;
				
				padding-top: 0.5em;
				padding-bottom: 0.5em;
								
			}
			
			.side,
			.main {
			
				display: flex;
				flex-direction: column;
				align-items: stretch;
			
				padding-top: 1em;
				padding-bottom: 1em;
				
				overflow-y: auto;
				
				> small {
				
					display: flex;
					flex-direction: row;
					align-items: center;
					
					padding-top: 1.5em;
					margin-top: auto;
					font-size: 75%;
					color: #999;
					
				}
				
			}
			
			> .home,
			> .side {
			
				padding-left: 1em;
				padding-right: 0.75em;
				
				border-right-style: solid;
				background-color: #F4F5F6;
				
			}

			> .head,
			> .main {
			
				padding-right: 1em;
				padding-left: 1em;
				
			}
				
			> .home {
				
				grid-area: home;
				
				> :first-child {
					margin-right: 0.125rem;
					transform: translateX(-0.25rem);
				}
				
				> :last-child {
					margin-left: auto;
				}
				
			}
						
			> .side {
				grid-area: side;
				font-size: 90%;
			}

			> .head {
			
				grid-area: head;
				
				> h1 {
				
					flex-grow: 1;
					font-size: 125%;
					
					> a {
					
						font-weight: bold;
					
						*+&::before {
							content: '›';
							padding: 0 0.25em;
						}
					
					}
					
				}
				
				> :last-child {
					margin-left: auto;
				}
				
			}
			
			> .main {
				grid-area: main;
			}

		}`}>


			<div className={"home"}>
				<button title="Log in"><LogIn/></button>
				<h1>
					<button>EC2U Connect Centre</button>
				</h1>
				<button title={`About ${title}`}><Logo/></button>
			</div>

			<div className={"side"}>

				{side}

				<small>
					<span>{(document.querySelector("meta[name=copyright]") as HTMLMetaElement).content}</span>
					<button style={{ marginLeft: "auto" }}><Heart/></button>
				</small>

			</div>

			<div className={"head"}>
				<h1>{name}</h1>
				<nav>{menu}</nav>
			</div>

			<div className={"main"}>{children}</div>

		</div>
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Logo() {

	let size="2.5em";

	return <span style={{
		width: size,
		height: size,
		backgroundImage: `url('${(document.querySelector("link[rel=icon]") as HTMLLinkElement).href}')`,
		backgroundSize: "contain",
		backgroundRepeat: "no-repeat",
		backgroundPosition: "center right"
	}}/>;

}

