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

import { immutable, multiple, optional, required } from "@metreeca/core";
import { id, toIdString } from "@metreeca/core/id";
import { string } from "@metreeca/core/string";
import { text, toTextString } from "@metreeca/core/text";
import { TileMark } from "@metreeca/view/widgets/mark";
import React, { createElement } from "react";
import "./credentials.css";


export const Credential = immutable({

	credentialCategory: required(string),
	url: multiple(id),
	name: optional(text),
	description: optional(text)

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function DataCredential({

	credential

}: {

	credential: typeof Credential

}) {

	return createElement("data-credential", {}, <>

		<div>

			<span>{credential.credentialCategory}</span>

			{credential.name && <span>{toTextString(credential.name)}</span>}

			{credential.url?.length && credential.url.map(item =>
				<a key={item} href={item}>{toIdString(item, { compact: true })}</a>
			)}

		</div>

		{credential.description && <TileMark>{toTextString(credential.description)}</TileMark>}

	</>);

}
