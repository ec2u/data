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

import { by, locale } from "@metreeca/core/order";
import { Link } from "@metreeca/tile-cell/link";
import type { ComponentChildren } from "preact";


/**
 * Renders a list of linked resources for an info panel.
 *
 * @param entries The resources to be listed, each with its identifier and label
 * @param look The look of the links; plain if omitted
 *
 * @returns A list of links sorted by label, or `undefined` if `entries` is empty, so that the panel omits the entry
 */
export function links(

	entries: readonly { readonly id: string, readonly label: string }[],
	look?: "strong"

): ComponentChildren {

	return entries.length > 0 ? <ul>{[...entries] // copy, as entries are shared

		.sort(by(({ label }) => label, locale()))
		.map(({ id, label }) => <li key={id}><Link look={look} href={id}>{label}</Link></li>)

	}</ul> : undefined;

}
