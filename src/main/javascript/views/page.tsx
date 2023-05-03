/*
 * Copyright © 2020-2023 EC2U Alliance
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
import { Value } from "@metreeca/core/value";
import { ToolPage } from "@metreeca/view/layouts/page";
import { ToolPath } from "@metreeca/view/widgets/path";
import React, { ReactNode, useState } from "react";


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

	name?: undefined | Value | Array<undefined | Value>
	menu?: ReactNode

	done?: ReactNode
	back?: ReactNode

	tray?: ReactNode
	info?: ReactNode

	children: ReactNode

}) {

	useState();

	return <ToolPage

		logo={<DataLogo/>}

		name={<ToolPath>{name}</ToolPath>}
		menu={menu}

		done={done}
		back={back}

		tray={tray}
		info={info}

	>{

		children

	}</ToolPage>;

}