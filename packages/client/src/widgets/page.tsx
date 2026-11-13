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

import { Style } from "@metreeca/clay-widgets/style";
import { Tool } from "@metreeca/clay-widgets/tool";
import { useFetching } from "@metreeca/clay/fetch";
import { type ComponentChildren, h } from "preact";
import "./page.css";
import { Logo } from "./logo.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Page({

	more,
	tray,
	meta,

	head,
	menu,
	foot,

	children

}: {

	meta?: ComponentChildren
	tray?: ComponentChildren
	more?: ComponentChildren

	head?: ComponentChildren
	menu?: ComponentChildren
	foot?: ComponentChildren

	children?: ComponentChildren

}) {

	const busy = useFetching();

	return <Style css={{

		linkLook: "strong"

	}}>

		<Tool

			busy={busy}

			mark={<Logo/>}

			meta={meta}
			tray={tray}
			more={more}

			head={<Style css={{

				fontFamily: "fontFamilyHeading",
				fontWeight: "fontWeightStrong"

			}}>

				{head}

			</Style>}

			menu={menu}
			foot={foot}

		>

			{children}

		</Tool>

	</Style>;

}
