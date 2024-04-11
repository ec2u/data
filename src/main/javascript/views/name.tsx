/*
 * Copyright © 2020-2024 EC2U Alliance
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

import { Frame } from "@metreeca/core/frame";
import { isLocal, local, toLocalString } from "@metreeca/core/local";
import { isString } from "@metreeca/core/string";
import * as React from "react";

export function DataName({

	children: {
		title,
		label
	}

}: {

	children: Readonly<Frame & {
		label?: string | typeof local.model
		title?: string | typeof local.model
	}>

}) {

	const _label=isLocal(label) ? toLocalString(label) : isString(label) ? label : undefined;
	const _title=isLocal(title) ? toLocalString(title) : isString(title) ? title : undefined;

	return _title && _title !== _label ? <h1>{_title}</h1> : null;
}