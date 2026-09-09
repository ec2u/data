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

import { digest, type Digest } from "@/_/gear-store/_digest.js";
import { Topic } from "@/taxonomies/index.js";
import type { State } from "@metreeca/blue/value";
import { required } from "@metreeca/core/arrays";
import type { IRI } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/structures";
import type { Task } from "@metreeca/flow";
import { map } from "@metreeca/flow/tasks";
import type { Record } from "@metreeca/gear-csv";


const NotationPattern = /^\d+$/;
const LabelSeparator = ";";


/**
 * Creates a task converting tabular concept definitions into topic records.
 *
 * Records are read from the `id`, `notation`, `label`, `alternative`, `hidden` and `definition` columns, with
 * `alternative` and `hidden` holding `;`-separated lists of labels; blank fields are ignored and other columns are
 * left alone.
 *
 * Each record is identified by {@link createTopicId}, so the same row always yields the same topic. The hierarchy is
 * read off that identifier, taken as a `/`-separated path: a topic is linked to the topics its ancestor paths name,
 * and one sitting at the root of the path is flagged as a top concept of `taxonomy`. Records are converted one at a
 * time, so every ancestor path is expected to be stated by a record of its own.
 *
 * @param taxonomy The taxonomy the topics are attributed to
 * @param taxonomy.id The identifier of the concept scheme the topics belong to
 *
 * @returns A task converting a feed of tabular concept definitions into a feed of immutable topic records
 *
 * @throws {@link !TypeError TypeError} While the feed is consumed, if a record states no identifier or no label
 */
export function convert(taxonomy: {

	readonly id: IRI

}): Task<Record, State<typeof Topic>> {

	return map(record => topic(taxonomy, record));

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
export function createTopicId(taxonomy: {

	readonly id: IRI

}, record: Record): IRI {

	return identify(taxonomy, required(field(record, "id")));

}

/**
 * Fingerprints a tabular concept definition.
 *
 * Columns are digested irrespective of the order they are listed in, so a record yields the same fingerprint as long
 * as its own content is unchanged and a workflow may skip whatever it already converted under that fingerprint.
 *
 * @param record The tabular concept definition to be fingerprinted
 *
 * @returns The digest of the content of `record`
 */
export function createTopicDigest(record: Record): Digest {

	return digest(JSON.stringify(Object.entries(record).sort(([x], [y]) => x < y ? -1 : x > y ? 1 : 0)));

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function topic(taxonomy: { readonly id: IRI }, record: Record): State<typeof Topic> {

	const id = required(field(record, "id"));
	const prefLabel = required(field(record, "label"));

	// a purely numeric identifier doubles as the notation of the topic it names

	const notation = field(record, "notation") ?? (NotationPattern.test(id) ? id : undefined);
	const definition = field(record, "definition");

	const broader = ancestors(taxonomy, id);

	return immutable({

		id: createTopicId(taxonomy, record),

		dataset: taxonomy.id,

		digest: createTopicDigest(record),

		label: notation === undefined ? prefLabel : `${notation} - ${prefLabel}`,
		comment: definition,

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


function ancestors(taxonomy: { readonly id: IRI }, id: string): readonly IRI[] {

	const segments = id.split("/");

	return segments.slice(0, -1).map((_, index) => identify(taxonomy, segments.slice(0, index+1).join("/")));

}

function identify(taxonomy: { readonly id: IRI }, path: string): IRI {

	return `${taxonomy.id}/${path}`;

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
