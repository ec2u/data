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

import { Link } from "@metreeca/tile-cell/link";
import { Markdown } from "@metreeca/tile-cell/markdown";
import { Stack } from "@metreeca/tile-hive/stack";
import { getIRIHost } from "@metreeca/work/core/resources.js";


/**
 * The values a credential is shown with, as a retrieval model.
 */
export const CredentialModel = {

	credentialCategory: {},
	name: {},
	url: {},
	description: {}

};


/**
 * Creates a credential summary.
 *
 * Shows the category of a credential awarded on completion of an educational offering, followed by its name and the
 * pages describing it, over its description.
 */
export function Credential({

	credential: { credentialCategory, name, url = [], description }

}: {

	/**
	 * The credential to be shown.
	 */
	credential: {
		readonly credentialCategory: string
		readonly name?: string
		readonly url?: readonly string[]
		readonly description?: string
	}

}) {

	return <Stack space={"spacing025"}>

		<span>{[

			<strong key={"category"}>{credentialCategory}</strong>,

			...(name ? [<span key={"name"}> · {name}</span>] : []),

			...url.map(href => <span key={href}> · <Link href={href}>{getIRIHost(href)}</Link></span>)

		]}</span>

		{description && <Markdown>{description}</Markdown>}

	</Stack>;

}
