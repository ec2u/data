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
import { useFetching } from "@metreeca/clay/fetch";
import { Link } from "@metreeca/clay-widgets/link";
import { Strip } from "@metreeca/clay-widgets/strip";
import { Style } from "@metreeca/clay-widgets/style";
import { Tool } from "@metreeca/clay-widgets/tool";
import { type ComponentChildren, h } from "preact";
import "./page.css";
import { ec2u } from "../index.core.js";

const brand=new URL("../index.svg", import.meta.url).href;

export function Page({

	tray,
	info,
	reset,

	head,
	menu,
	back,
	copy,

	children

}: {

	tray?: ComponentChildren
	info?: ComponentChildren
	reset?: ComponentChildren

	head?: ComponentChildren
	menu?: ComponentChildren
	back?: ComponentChildren
	copy?: ComponentChildren

	children?: ComponentChildren

}) {

	const busy=useFetching();

	return <Style css={{

		linkLook: "strong"

	}}>

		<Tool

			busy={busy}

			meta={<Strip grow place={reset ? "tail" : "start"} align={"center"}>

				<img class={"brand"} alt={""} src={brand}/>
				<Link href={"/"}>{ec2u(app.name ?? "")}</Link>
				{reset}

			</Strip>}

			tray={tray}
			more={info}

			head={head}
			menu={back ?? menu}
			copy={copy}

		>{children}</Tool>

	</Style>;

}
