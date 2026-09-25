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

import { Button } from "@metreeca/tile-cell/button";
import { Icon } from "@metreeca/tile-cell/icon";
import { Link } from "@metreeca/tile-cell/link";
import { Logo } from "@metreeca/tile-cell/logo";
import { app } from "@metreeca/tile-data";
import { Shell } from "@metreeca/tile-hive/shell";
import { Strip } from "@metreeca/tile-hive/strip";
import { Style } from "@metreeca/tile-hive/style";
import { type ComponentChildren, h } from "preact";


const FontSize = "scaling150";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const Root = "/";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Page({

	head

}: {

	head?: ComponentChildren

}) {

	return <Shell

		logo={<Style css={{ fontSize: FontSize }}>

			<Link look="strong" href={Root}><Logo/><span>{app.name}</span></Link>

		</Style>}

		head={<Style css={{ fontSize: FontSize }}>

			{head}

		</Style>}

		menu={<Button look={"subtle"} icon={<Icon.Help/>} title={"Help"}></Button>}

		copy={<Strip grow place={"head"}>

			<small>{app.copy}</small>
			<Link href={"https://github.com/ec2u/data"} title={"GitHub Repository"}><Icon.GitHub/></Link>

		</Strip>}

	/>;

}
