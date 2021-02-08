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
import { ChevronRight, Info } from "react-feather";
import { NavLink } from "react-router-dom";

const title=document.title;
const icon=(document.querySelector("link[rel=icon]") as HTMLLinkElement).href; // !!! handle nulls
const copy=(document.querySelector("meta[name=copyright]") as HTMLMetaElement).content; // !!! handle nulls


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Props {

	name?: JSX.Element | string
	menu?: JSX.Element
	side?: JSX.Element

	children?: React.ReactNode

}

export default function ToolPage({

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
			
			display: flex;
			flex-direction: row;
			align-items: stretch;
			
			> * {
							
				display: flex;
				flex-direction: column;
				align-items: stretch;
				
				overflow-x: hidden;					
				overflow-y: auto;

				> header {
				
					position: sticky;
					top: 0;
				
					display: flex;
					flex-direction: row;
					align-items: center;
					
					z-index: 1;
					flex-shrink: 0;
					
					height: 3.5rem;
					
					white-space: nowrap;
									
				}
				
				> section {
				
					flex-grow: 1;
								
					display: flex;
					flex-direction: column;
					align-items: stretch;

					padding-top: 1rem;
					padding-bottom: 0.5rem;
									
					> small {
					
						display: flex;
						flex-direction: row;
						align-items: center;
						
						padding-top: 1.5em;
						margin-top: auto;
						
						white-space: nowrap;
						
						font-size: 75%;
						color: #999;
						
					}
					
				}
			
			}
				
			> nav {
			
				flex-shrink: 0;
			
				width: 15rem;
								
				border-right-style: solid;
				border-color: #EEE;
				background-color: #F4F5F6;

				> * {
				
					padding-left: 1rem;
					padding-right: 0.75rem;
					
				}
				
				> header {
					
					box-shadow: 0 0 0.5rem 0.5rem #F4F5F6;
					
					> :first-child {
						margin-right: -0.125rem;
						transform: translateX(-0.25rem);
					}
					
					> :last-child {
						margin-left: auto;
					}
					
				}
							
				> section {
	
					font-size: 90%;
					
				}
				
			}

			> main {
			
				flex-grow: 1;
			
	            > * {
				
					padding-right: 1rem;
					padding-left: 1rem;
					
				}

				> header {
						
					box-shadow: 0 0 0.5rem 0.5rem #FFF;
								
					> h1 {
					
						flex-grow: 1;
						font-size: 125%;
						
						> a {
						
							font-weight: bold;
							
							:not(:first-child)::before {
								content: '›';
								padding: 0 0.25em;
							}
						
						}
											
					}
					
					> nav {
						
						display: flex;
						flex-direction: row;
						align-items: center;
						
					}
					
				}

				> section {
				
					> * {
						flex-shrink: 0;
					}
						
				}

			}
	
		}`}>

			<nav>

				<header>
					<ChevronRight/> {/*<button title="Log in"><LogIn/></button>*/}
					<h1>
						<NavLink to={"/"}>EC2U Connect Centre</NavLink>
					</h1>
					<button><Logo/></button>
				</header>

				<section>

					{side}

					<small>
						<span>{copy}</span>
						<button title={`About ${title}`} style={{ marginLeft: "auto" }}><Info/></button>
					</small>

				</section>

			</nav>

			<main>

				<header>
					<h1>{name}</h1>
					<nav>{menu}</nav>
				</header>

				<section>
					{children}
				</section>

			</main>

		</div>
	);

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Logo() {

	let size="2.5rem";

	return <span style={{
		width: size,
		height: size,
		backgroundImage: `url('${icon}')`,
		backgroundSize: "contain",
		backgroundRepeat: "no-repeat",
		backgroundPosition: "center right"
	}}/>;

}

