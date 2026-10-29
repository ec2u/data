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

import { opt, type URLLike } from "@metreeca/core";
import { multiple, optional, required } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { map } from "@metreeca/flow/tasks";
import { csv as parse, type Record } from "@metreeca/mime-csv";
import { fetch } from "@metreeca/pipe-url";
import type { Draft } from "../sinks/sync.js";


const NotationPattern = /^\d+$/;
const LabelSeparator = ";";

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a CSV taxonomy loader.
 *
 * Retrieves each document and reads it as a CSV table with a header row, blank rows skipped, one topic draft per row.
 * A row names its topic with a slash-separated `id` path nested along the hierarchy, so the paths above it name its
 * broader topics; it carries the preferred `label`, the `alternative` and `hidden` labels, separated by semicolons,
 * the `notation` and the `definition` of the topic. A purely numeric top-level `id` doubles as the notation.
 *
 * @returns A task converting a feed of CSV document URLs into a feed of topic drafts
 *
 * @throws {@link !TypeError TypeError} While the feed is consumed, if a row lacks an `id` or a `label`
 */
export function csv(): Task<URLLike, Draft> {

	return urls => pipe(
		(items(urls))
		(fetch())
		(parse(CSVFormat))
		(map(draft))
	);


	function draft(record: Record): Draft {

		const id = required(record.id);
		const path = id.split("/");

		const notation = record.notation
			?? (path.length === 1 && NotationPattern.test(path[0]) ? path[0] : undefined);

		const alternativeLabels = labels("alternative");
		const hiddenLabels = labels("hidden");

		const broader = path.slice(0, -1).map((_, index) => path.slice(0, index+1).join("/"));

		return immutable({

			id,

			notation: optional(notation),

			prefLabel: { en: required(record.label) },
			altLabel: alternativeLabels.length === 0 ? undefined : { en: alternativeLabels },
			hiddenLabel: hiddenLabels.length === 0 ? undefined : { en: hiddenLabels },
			definition: opt(record.definition, definition => ({ en: definition })),

			broader: multiple(broader.slice(-1)),
			broaderTransitive: multiple(broader)

		});


		function labels(column: string): readonly string[] {
			return record[column]
					?.split(LabelSeparator)
					.map(label => label.trim())
					.filter(label => label !== "")
				?? [];
		}

	}

}
