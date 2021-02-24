/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { ComponentChild, ComponentChildren, h } from "preact";
import { Link } from "preact-router";
import { useEffect, useState } from "preact/hooks";
import { Custom } from "./custom";
import ToolLoader from "./loader";
import "./page.less";

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
	const [mockup, setMockup]=useState((JSON.parse(sessionStorage.getItem("mockup") || "false")));

	useEffect(() => {
		sessionStorage.setItem("mockup", JSON.stringify(mockup));
	});

	return (
		<Custom tag="tool-page">

			<aside>

				<header>

					<Link href={"/"} title={title} style={{ backgroundImage: `url(${icon})` }} onClick={e => {

						if ( e.shiftKey ) {

							e.preventDefault();
							setHidden(!hidden);

						} else if ( e.altKey ) {

							e.preventDefault();
							setMockup(!mockup);

						}

					}}/>

					<h1><a href={"/"}>EC2U Knowledge Hub</a></h1>

				</header>

				<section>{hidden ? <Hidden/> : mockup ? side : null}</section>

			</aside>

			<main>

				<header>
					<h1>{mockup ? name : "Work in progress…"}</h1>
					<nav>{mockup ? menu : <ToolLoader/>}</nav>
				</header>

				<section>{mockup ? children : null}</section>

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


