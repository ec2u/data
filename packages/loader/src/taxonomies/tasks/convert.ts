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

import { digest } from "@metreeca/work/core/digest.js";
import { compress, synopsis } from "@metreeca/llms";
import { getTopicEmbedding } from "../index.core.js";
import { getTopicId, Taxonomy, Topic } from "@ec2u/data-shared/taxonomies/index.js";
import { CommentLength } from "@ec2u/data-shared";
import type { State } from "@metreeca/blue/value";
import { multiple, optional, required } from "@metreeca/core/arrays";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import type { Record } from "@metreeca/mime-csv";
import type { Reference } from "@metreeca/qest/state";


const NotationPattern = /^\d+$/;
const LabelSeparator = ";";


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function convert(taxonomy: State<typeof Taxonomy>): Task<Record, State<typeof Topic>> {

	return map(async record => {

		const path = getPath(record);

		// a purely numeric identifier doubles as the notation of the topic it names

		const notation = record.notation
			?? (path.length === 1 && NotationPattern.test(path[0]) ? path[0] : undefined);

		const preferredLabel = required(record.label);
		const alternativeLabels = labels(record, "alternative");
		const hiddenLabels = labels(record, "hidden");
		const definition = record.definition;

		const broader = getLineage(taxonomy, path);

		const embedding = await getTopicEmbedding(synopsis(
			preferredLabel,
			alternativeLabels,
			hiddenLabels,
			definition
		));

		return immutable({

			id: getTopicId(taxonomy, path),

			dataset: required(taxonomy.id),

			label: required(notation === undefined ? preferredLabel : `${notation} - ${preferredLabel}`),
			comment: optional(definition === undefined ? undefined : clip(definition, CommentLength)),

			notation: optional(notation),

			prefLabel: required(preferredLabel),
			altLabel: multiple(alternativeLabels),
			hiddenLabel: multiple(hiddenLabels),
			definition: optional(definition),

			inScheme: required(taxonomy.id),
			topConceptOf: optional(broader.length === 0 ? taxonomy.id : undefined),

			broader: multiple(broader.slice(-1)),
			broaderTransitive: multiple(broader),

			digest: required(digest(record)),
			embedding: required(compress(embedding))

		});

	});

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getPath(record: Record): readonly string[] { // !!! question export

	return required(record.id).split("/");

}

function labels(record: Record, column: string): readonly string[] {

	return record[column]
			?.split(LabelSeparator)
			.map(label => label.trim())
			.filter(label => label !== "")
		?? [];

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function getLineage(taxonomy: State<typeof Taxonomy>, path: readonly string[]): readonly Reference[] {

	return path
		.slice(0, -1)
		.map((_, index) => getTopicId(taxonomy, path.slice(0, index+1)));

}
