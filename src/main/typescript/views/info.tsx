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

import { optional } from "@metreeca/core";
import { id } from "@metreeca/core/id";
import { useRouter } from "@metreeca/data/contexts/router";
import { useResource } from "@metreeca/data/models/resource";
import { HelpCircleIcon } from "@metreeca/view/widgets/icon";
import React from "react";

export function DataInfo() {

	const [route, setRoute]=useRouter();

	const [resource]=useResource({ id: route, isDefinedBy: optional(id) });

	const isDefinedBy=resource?.isDefinedBy;

	function open() {
		isDefinedBy && setRoute(isDefinedBy);
	}

	return isDefinedBy && <button title={"View Dataset Docs"}

        onClick={open}

        style={{
			transform: "scale(0.75)"
		}}

    >{<HelpCircleIcon/>}</button>;

}