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

import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Logo } from "@metreeca/tile-cell/logo";
import { app } from "@metreeca/tile-data";
import { Shell } from "@metreeca/tile-hive/shell";
import { Strip } from "@metreeca/tile-hive/strip";
import { type ComponentChildren, h } from "preact";
import "./page.css";

export function Page({

	tray,
	info,

	head,
	menu,
	done,
	back,

	children

}: {

	tray?: ComponentChildren
	info?: ComponentChildren

	head?: ComponentChildren
	menu?: ComponentChildren

	done?: ComponentChildren
	back?: ComponentChildren

	children?: ComponentChildren

}) {

	return <Shell

		logo={<Link look="subtle" href={"/"}><Logo/><span>{app.name}</span></Link>}

		tray={tray}
		info={info}

		head={head}
		menu={menu}

		done={done}
		back={back}

		copy={<Strip grow place={"head"}>

			<small>{app.copy}</small>
			<Link href={"https://github.com/ec2u/data"} title={"GitHub Repository"}><Icon.GitHub/></Link>

		</Strip>}

	>{children}</Shell>;

}
