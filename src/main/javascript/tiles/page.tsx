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
import { User } from "react-feather";
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
			
 				position: relative; // support page-relative content positioning
							
				display: flex;
				flex-direction: column;
				align-items: stretch;
				
				overflow-x: hidden;					
				overflow-y: auto;

				> header {
				
					flex-shrink: 0;
	
					position: sticky;
					top: 0;
				
					display: flex;
					flex-direction: row;
					align-items: center;
					
					z-index: 1;
					
					height: 4rem;
										
					box-shadow: 0 0 0.5rem 0.5rem #FFF; // !!! factor
	
					white-space: nowrap;
					font-size: 125%;
		
					> h1 {
					
						flex-grow: 1;
	
						> *+a::before {
							content: '›';
							padding: 0 0.25em;
						}
											
					}
					
					> nav {
						
						display: flex;
						flex-direction: row;
						align-items: center;
						
					}
					
				}

				> section {
				
					flex-grow: 1;

					padding-top: 1rem;
					padding-bottom: 1rem;

				}
			
			}
							
			> aside {
			
				flex-shrink: 0;
			
				width: 15rem;
											
				border-right-style: solid;
				border-color: #EEE;
				background-color: #F4F5F6;
				
				> * {
				
					padding-left: 2rem;
					padding-right: 0.75rem;
					
				}
				
				> header {
					
					box-shadow: 0 0 0.5rem 0.5rem #F4F5F6; // !!! factor
					
					> :first-child {
					
						width: 1em;
						height: 1em;

						background-image: url('${icon}');
						background-size: contain;
						background-repeat: no-repeat;
						background-position: center;
						
						transform: translateX(-10%) scale(2);
						transform-origin: right center;

					}

				}
							
				> section {
	
					font-size: 90%;
					
				}
		
			}

			> main {
			
				flex-grow: 1;
			
	            > * {
				
					padding-left: 1.5rem;
					padding-right: 1.5rem;
					
				}

			}
	
		}`}>

			<aside>

				<header>
					<NavLink to={"/about"} title={`About ${title}`}/>
					<h1><NavLink to={"/"}>Knowledge Hub</NavLink></h1>
					<NavLink to={"/user"}><User/></NavLink> { /* !!! log in / user name*/}
				</header>

				<section>{side}</section>

			</aside>

			<main>

				<header>
					<h1>{name}</h1>
					<nav>{menu}</nav>
				</header>

				<section>{children}</section>

			</main>

		</div>
	);

}


