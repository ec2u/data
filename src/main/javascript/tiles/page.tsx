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

import { ComponentChild, ComponentChildren, h } from "preact";
import { Bookmark, User } from "preact-feather";
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
					<Link href={"/user"}><Bookmark/></Link>
					<Link href={"/user"}><User/></Link> { /* !!! log in / user name*/}
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

