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
import { Feedback } from "./feedback.js";
import { Logo } from "./logo.js";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Page({

	gist,

	more = <Feedback/>,
	tray,
	meta,

	head,
	menu,
	foot,

	children

}: {

	/**
	 * What the page body shows, such as the criteria a catalogue narrows its results by; a change brings the body back
	 * to its top, so the reader never lands halfway down results they have not read.
	 */
	gist?: unknown

	meta?: ComponentChildren
	tray?: ComponentChildren

	/**
	 * The secondary controls at the foot of the side column; a {@link Feedback} bar if omitted, none if `null`.
	 */
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
			gist={gist}

			mark={<Logo/>}

			meta={meta && <Style css={{

				buttonLook: "subtle"

			}}>

				{meta}

            </Style>}

			tray={tray}
			more={more}

			head={<Style css={{

				fontFamily: "fontFamilyHeading",
				fontWeight: "fontWeightStrong",
				buttonLook: "subtle"

			}}>

				{head}

			</Style>}

			menu={menu && <Style css={{

				buttonLook: "subtle"

			}}>

				{menu}

            </Style>}

			foot={foot}

		>

			{children}

		</Tool>

	</Style>;

}
