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

import type { ResourceShape } from "@metreeca/blue/resource";
import { Path } from "@metreeca/clay-widgets/path";
import { Style } from "@metreeca/clay-widgets/style";
import type { Lazy } from "@metreeca/core";
import { Count } from "@metreeca/tile-widgets/viewers/count";
import type { Collection, Collections } from "@metreeca/tile/collection";
import { useCount } from "@metreeca/tile/count";


/**
 * Heads a collection page with its name and item count.
 *
 * Shows the name alone until the items are counted, or if the count fails, then a path from the name to the count,
 * set subdued and in title case, kept on show while the items are counted again under new filters.
 */
export function Size<S extends Lazy<ResourceShape>, P extends Collections<S>>({

	label,
	collection

}: {

	label: string
	collection: Collection<S, P>

}) {

	const count = useCount(collection);

	return count({

		ready: () => <Path>

			{label}

			<Style css={{ colorLabel: "colorPlaceholder", textTransformHeading: "capitalize" }}>
				<Count collection={collection} count={count}/>
			</Style>

		</Path>

	}) ?? label;

}
