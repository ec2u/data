/*
 * Copyright © 2020-2026 EC2U Alliance
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

import { app } from "@metreeca/clay";
import { Icon } from "@metreeca/clay-widgets/icon";
import { Link } from "@metreeca/clay-widgets/link";
import { Logo } from "@metreeca/clay-widgets/logo";
import { Strip } from "@metreeca/clay-widgets/strip";
import { Tool } from "@metreeca/clay-widgets/tool";
import { type ComponentChildren, h } from "preact";
import "./page.css";
import { ec2u } from "../index.core.js";

export function Page({

	tray,
	info,

	head,
	menu,
	back,

	children

}: {

	tray?: ComponentChildren
	info?: ComponentChildren

	head?: ComponentChildren
	menu?: ComponentChildren
	back?: ComponentChildren

	children?: ComponentChildren

}) {

	return <Tool

		meta={<Link look="subtle" href={"/"}><Logo/><span>{ec2u(app.name ?? "")}</span></Link>}

		tray={tray}
		more={info}

		head={head}
		menu={back ?? menu}

		copy={<Strip grow place={"head"}>

			<small>{app.copy}</small>
			<Link href={"https://github.com/ec2u/data"} title={"GitHub Repository"}><Icon.GitHub class={"repo"}/></Link>

		</Strip>}

	>{children}</Tool>;

}
