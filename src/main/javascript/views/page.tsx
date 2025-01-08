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
import { asArray } from "@metreeca/core";
import { title } from "@metreeca/data/contexts/router";
import { app } from "@metreeca/view";
import { ToolPage } from "@metreeca/view/layouts/page";
import { Github } from "@metreeca/view/widgets/icon";
import { Path, ToolPath } from "@metreeca/view/widgets/path";
import React, { ReactNode, useEffect } from "react";


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

	useEffect(() => { title(name); }, asArray(name) ?? [name]);

	return <ToolPage

		logo={<DataLogo/>}

		name={<ToolPath>{name}</ToolPath>}
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

		children

	}</ToolPage>;

}