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

import { digest } from "@/_/gear-store/_digest.js";
import { compress, createEmbedder, embeddable } from "@/_/muse/embedder/index.js";
import { createTopicId, Taxonomy, Topic } from "@/taxonomies/index.js";
import { CommentLength } from "@/vocabularies/ec2u.js";
import type { Instance } from "@metreeca/blue/value";
import { required } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { clip } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/structures";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import type { Record } from "@metreeca/gear-csv";


const NotationPattern = /^\d+$/;
const LabelSeparator = ";";


/**
 * Creates a task converting tabular concept definitions into topic records.
 *
 * Records are read from the `id`, `notation`, `label`, `alternative`, `hidden` and `definition` columns, with
 * `alternative` and `hidden` holding `;`-separated lists of labels; blank fields are ignored and other columns are
 * left alone. The definition doubles as the comment of the topic, clipped to the budget a topic comment admits, so an
 * overlong entry is summarised rather than rejected and its full text stays available as the definition.
 *
 * Each record is identified by {@link readTopicId}, so the same row always yields the same topic. The hierarchy is
 * read off that identifier, taken as a `/`-separated path: a topic is linked to the topics its ancestor paths name,
 * and one sitting at the root of the path is flagged as a top concept of `taxonomy`. Records are converted one at a
 * time, so every ancestor path is expected to be stated by a record of its own.
 *
 * Every topic carries the embedding of its labels and definition, so that a resource is later classified under it
 * without embedding the taxonomy again: the cost is paid once, as the record is converted.
 *
 * @param taxonomy The taxonomy the topics are attributed to
 * @param taxonomy.id The identifier of the concept scheme the topics belong to
 *
 * @returns A task converting a feed of tabular concept definitions into a feed of immutable topic records
 *
 * @throws {@link !Error Error} If no execution is running, as the embedder is resolved from the enclosing one
 *
 * @throws {@link !TypeError TypeError} While the feed is consumed, if a record states no identifier or no label
 */
export function convert(taxonomy: Instance<typeof Taxonomy>): Task<Record, Instance<typeof Topic>> {

	const embedder = service(createEmbedder);

	return map(async record => {

		const stated = topic(taxonomy, record);

		// the labels and the definition together stand for the topic, as a resource is classified by what it is about
		// rather than by the wording of its preferred label alone

		const embedding = await embedder(embeddable(
			stated.prefLabel,
			...stated.altLabel ?? [],
			...stated.hiddenLabel ?? [],
			stated.definition
		));

		return immutable({ ...stated, embedding: compress(embedding) });

	});

}

/**
 * Names the topic a tabular concept definition defines.
 *
 * Identity rests on the `id` column alone, so a workflow naming what it stores and one naming what it retracts agree
 * without conferring, whatever the rest of the record says.
 *
 * @param taxonomy The taxonomy the topic is attributed to
 * @param taxonomy.id The identifier of the concept scheme the topic belongs to
 * @param record The tabular concept definition naming the topic
 *
 * @returns The identifier of the topic `record` defines within `taxonomy`
 *
 * @throws {@link !TypeError TypeError} If `record` states no identifier
 */
export function readTopicId(taxonomy: Instance<typeof Taxonomy>, record: Record): IRI {

	return createTopicId(taxonomy, segments(required(field(record, "id"))));

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function topic(taxonomy: Instance<typeof Taxonomy>, record: Record): Omit<Instance<typeof Topic>, "embedding"> {

	const id = required(field(record, "id"));
	const prefLabel = required(field(record, "label"));

	// a purely numeric identifier doubles as the notation of the topic it names

	const notation = field(record, "notation") ?? (NotationPattern.test(id) ? id : undefined);
	const definition = field(record, "definition");

	const broader = ancestors(taxonomy, id);

	return immutable({

		id: createTopicId(taxonomy, segments(id)),

		dataset: taxonomy.id,

		digest: digest(record),

		label: notation === undefined ? prefLabel : `${notation} - ${prefLabel}`,
		comment: definition === undefined ? undefined : clip(definition, CommentLength),

		notation,

		prefLabel,
		altLabel: labels(record, "alternative"),
		hiddenLabel: labels(record, "hidden"),
		definition,

		inScheme: taxonomy.id,
		topConceptOf: broader.length === 0 ? taxonomy.id : undefined,

		broader: broader.slice(-1),
		broaderTransitive: broader

	});

}

function ancestors(taxonomy: Instance<typeof Taxonomy>, id: string): readonly IRI[] {

	const path = segments(id);

	return path.slice(0, -1).map((_, index) => createTopicId(taxonomy, path.slice(0, index+1)));

}

function segments(id: string): readonly string[] {

	return id.split("/");

}


function labels(record: Record, column: string): readonly string[] {

	return field(record, column)?.split(LabelSeparator)
			.map(label => label.trim())
			.filter(label => label !== "")
		?? [];

}

function field(record: Record, column: string): undefined | string {

	const value: undefined | string = record[column];
	const trimmed = value?.trim();

	return trimmed === undefined || trimmed === "" ? undefined : trimmed;

}
