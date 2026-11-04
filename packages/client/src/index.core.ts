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

import { base } from "@ec2u/data-shared";
import { courses } from "@ec2u/data-shared/courses/index.js";
import { documents } from "@ec2u/data-shared/documents/index.js";
import { events } from "@ec2u/data-shared/events/index.js";
import { programs } from "@ec2u/data-shared/programs/index.js";
import { units } from "@ec2u/data-shared/units/index.js";
import { universities } from "@ec2u/data-shared/universities/index.js";
import { by } from "@metreeca/core/order";
import { internalize, type IRI } from "@metreeca/core/resource";


/**
 * The number of values a tally facet shows at first and fetches with each batch, within the server result set limit.
 */
export const TallyOptions = 10;

/**
 * Root-relative ids of the datasets published on the hub, in display order.
 *
 * Ids are root-relative as the store resolves them against the serving origin rather than the hub id space.
 */
export const PublicDatasets: readonly IRI[] = [
	universities,
	units,
	programs,
	courses,
	documents,
	events
].map(({ id }) =>
	internalize(base, id)
);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Removes the leading alliance name from a label.
 *
 * @param label The label to be shortened
 *
 * @returns The label without its leading `EC2U` prefix, or the label unchanged if it carries none
 */
export function ec2u(label: string): string {
	return label.replace(/^EC2U\s+/, "");
}

/**
 * Orders dataset rows as the hub lists them, following the display order of {@link PublicDatasets}.
 */
export const byDataset = by(({ dataset }: { readonly dataset: { readonly id: IRI } }) =>
	PublicDatasets.indexOf(internalize(location.href, dataset.id))
);
