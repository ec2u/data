/*
 * Copyright © 2021 EC2U Consortium. All rights reserved.
 */

import { ComponentChild, ComponentChildren, h } from "preact";
import { Link } from "preact-router";
import { Custom } from "./custom";
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

	return (
		<Custom tag="tool-page">

			<aside>

				<header>
					<Link href={"/"} title={title} style={{ backgroundImage: `url(${icon})` }}/>
					<h1><a href={"/"}>EC2U Knowledge Hub</a></h1>
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

		</Custom>
	);

}

