/*
 * Copyright © 2020-2025 EC2U Alliance
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


import { DataLogo } from "@ec2u/data/views/logo";
import { asArray, isArray } from "@metreeca/core";
import { title } from "@metreeca/data/contexts/router";
import { useTrace } from "@metreeca/data/contexts/trace";
import { app } from "@metreeca/view";
import { TilePage } from "@metreeca/view/layouts/page";
import { TileHint } from "@metreeca/view/widgets/hint";
import { Github, NotFoundIcon } from "@metreeca/view/widgets/icon";
import { Path, TilePath } from "@metreeca/view/widgets/path";
import React, { ReactNode, useEffect } from "react";

export const NotFound="404 | Not Found";

export function DataPage({

	name,
	menu,

	done,
	back,

	tray,
	info,

	children

}: {

	locked?: boolean

	name?: Path
	menu?: ReactNode

	done?: ReactNode
	back?: ReactNode

	tray?: ReactNode
	info?: ReactNode

	children: ReactNode

}) {

	const [trace]=useTrace();

	useEffect(() => { title(name); }, asArray(name) ?? [name]);


	const is404=trace && trace.status === 404;

	return <TilePage

		logo={<DataLogo/>}

		name={is404
			? <TilePath>{isArray(name) && name.length > 1 ? [name[0], NotFound] : NotFound}</TilePath>
			: <TilePath>{name}</TilePath>
		}
		menu={menu}

		done={done}
		back={back}

		tray={tray}
		info={info}

		copy={<>
			<small>{app.copy}</small>
			<a title={"GitHub Repository"} href={"https://github.com/ec2u/data"}><Github/></a>
		</>}

	>{

		is404 ? <TileHint><NotFoundIcon/></TileHint> : children

	}</TilePage>;

}