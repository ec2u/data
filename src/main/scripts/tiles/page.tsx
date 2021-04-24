/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { Custom } from "@metreeca/tile/tiles/custom";
import { ComponentChild, ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import "./page.css";

const title=document.title;
const icon=(document.querySelector("link[rel=icon]") as HTMLLinkElement).href; // !!! handle nulls
const copy=(document.querySelector("meta[name=copyright]") as HTMLMetaElement).content; // !!! handle nulls


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface Props {

	name?: ComponentChild
	menu?: ComponentChild
	side?: ComponentChild

	children?: ComponentChildren

}

export default function ToolPage({

	name,
	menu,
	side,

	children

}: Props) {

	const [hidden, setHidden]=useState(false);

	return (
		<Custom tag="tool-page">

			<aside>

				<header>

					<a href={"/"} title={title} style={{ backgroundImage: `url(${icon})` }} onClick={e => {

						if ( e.shiftKey ) {

							e.preventDefault();
							setHidden(!hidden);

						}

					}}/>

					<h1><a href={"/"}>EC2U Knowledge Hub</a></h1>

				</header>

				<section>{hidden ? <Hidden/> : side}</section>

			</aside>

			<main>

				<header>
					<h1>{name}</h1>
					<nav>{menu}</nav>
				</header>

				<section>{children}</section>

			</main>

		</Custom>
	);

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Hidden() {
	return (
		<ul>
			<li><a href="/ewp/" target={"_blank"}>EWP APIs</a></li>
			<li><a href="/sparql" target={"_blank"}>SPARQL</a></li>
		</ul>
	);
}


