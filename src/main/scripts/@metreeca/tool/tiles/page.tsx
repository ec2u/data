/*
 * Copyright © 2020-2021 Metreeca srl
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

import * as React from "react";
import { createElement, ReactNode, useState } from "react";
import { classes } from "..";
import { Frame } from "../bases";
import { icon, useRouter } from "../nests/router";
import { Check, Edit3, IconProps, Link2, Menu, MoreHorizontal, Plus, Settings, Trash, X } from "./icon";
import "./page.css";

const logo={ style: { backgroundImage: `url(${icon})` } };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const EditIcon=(props: IconProps) => <Edit3 {...props}/>;
export const LinkIcon=(props: IconProps) => <Link2 {...props}/>;

export const InsertIcon=(props: IconProps) => <Plus {...props}/>;
export const RemoveIcon=(props: IconProps) => <X {...props}/>;

export const CreateIcon=(props: IconProps) => <Plus {...props}/>;
export const UpdateIcon=(props: IconProps) => <Check {...props}/>;
export const DeleteIcon=(props: IconProps) => <Trash {...props}/>;

export const ClearIcon=(props: IconProps) => <X {...props}/>;
export const CancelIcon=(props: IconProps) => <X {...props}/>;
export const ConfigureIcon=(props: IconProps) => <Settings {...props}/>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function ToolPage({

	disabled=false,

	head,
	side,
	foot,

	pane,

	item,
	menu,

	children,

	selection

}: {

	disabled?: boolean,

	head?: ReactNode
	side?: ReactNode
	foot?: ReactNode

	pane?: ReactNode

	item?: ReactNode
	menu?: ReactNode

	children?: ReactNode,

	selection?: Frame[]

}) {

	const { name, peek, link }=useRouter();

	const [tray, setTray]=useState(false);

	const frames=selection || [{ id: peek() }]; // !!! label???


	return createElement("tool-page", {

		disabled: disabled ? "" : undefined

	}, <>

		<aside {...classes({ tray })} onClick={e =>
			setTray(e.target !== e.currentTarget && !(e.target as Element).closest("a"))
		}>

			<nav>

				<header>{head || <a title={name()} href={"/"} {...logo}/>}</header>

				<section>{side}</section>

				<footer>{foot}</footer>

			</nav>

			<div>{pane}</div>

		</aside>

		<main>

			<div>

				<header>

					<button onClick={() => setTray(true)}><Menu/></button>

					<h1>{item}</h1>

					<nav>

						{
							link()

								? <>
									<button onClick={() => link(null)}><CancelIcon/></button>
									<button disabled={!link(true, frames)} onClick={() => link(false, frames)}><LinkIcon/>
									</button>
								</>

								: menu
						}

						<button><MoreHorizontal/></button>
						{/* !!! handle on mobile view */}

					</nav>

				</header>

				<section>{children}</section>

			</div>

		</main>

	</>);
}

