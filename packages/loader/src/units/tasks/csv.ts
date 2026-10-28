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

import type { University } from "@ec2u/data-shared/universities/index.core.js";
import { isDefined, opt, type URLLike } from "@metreeca/core";
import { multiple, required } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { filter, flat, map } from "@metreeca/flow/tasks";
import { csv as parse, type Record } from "@metreeca/mime-csv";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { VirtualInstitutes } from "../index.core.js";
import type { Dictionary, Draft, Name } from "../sinks/sync.js";


const logger = log(import.meta.url);

const NamePattern = /^([^,]+),([^(]+)(?:\(([^)]+)\))?$/;
const EmailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const ValueSeparator = ";";

const HomepageColumns = [
	"Factsheet",
	"Factsheet (English)",
	"Factsheet (Local)",
	"Homepage",
	"Homepage (English)",
	"Homepage (Local)"
];

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a CSV unit loader.
 *
 * Retrieves each sheet and reads it as a CSV table with a header row, blank rows skipped, one unit draft per row
 * naming the unit in English or in the local language of the university; rows named in neither are dropped as
 * placeholders. A row is keyed by its `Code`, falling back to its English and then to its local name, so renaming a
 * unit without a code lists it as a new one, and rows sharing a key state the same unit.
 *
 * Names and descriptions are stated in English and in the local language of `university`, from the `(English)` and
 * `(Local)` column pairs. Web addresses are read from the `Factsheet` and `Homepage` columns and their language
 * variants, the head from `Head` as `Family, Given (Title)`. A parent unit is named in `Parent`, semicolon-separated,
 * by its code, acronym or either name, matched regardless of case against the other rows of the same sheet; a unit
 * naming no parent, or only parents matching no row, stands directly under the university. A virtual institute is
 * named in `VI`, semicolon-separated, by its acronym. The `Type` column and the `Topics` column pair are handed on
 * unchanged, as cues guiding the classification of the unit against the EC2U organisation taxonomy and EuroSciVoc.
 *
 * Web addresses that do not parse as absolute `http` or `https` URLs, email addresses and names in any other form, and
 * virtual institutes matching none of the EC2U ones are left out, as is any column without a counterpart in the unit
 * model, such as the `Sector` and `Notes` columns the curated sheets carry for the benefit of their editors.
 *
 * @param university The university the sheets list units for, supplying the local language of its columns
 *
 * @returns A task converting a feed of CSV sheet URLs into a feed of unit drafts
 */
export function csv(university: University): Task<URLLike, Draft> {

	const { locale } = university;

	return urls => pipe(
		(items(urls))
		(fetch())
		(flat(map(async sheet => {

			const records = await pipe(
				(items([sheet]))
				(parse(CSVFormat))
				(filter(record => isDefined(record["Name (English)"] ?? record["Name (Local)"])))
				(toArray())
			);

			return records.map(record => draft(record, records));

		})))
	);


	function draft(record: Record, records: readonly Record[]): Draft {

		const definition = localised(record["Description (English)"], record["Description (Local)"]);
		const topics = values(`${record["Topics (English)"] ?? ""};${record["Topics (Local)"] ?? ""}`);

		return immutable({

			id: key(record),

			identifier: record["Code"],

			prefLabel: localised(record["Name (English)"], record["Name (Local)"]),
			altLabel: record["Acronym"],
			definition: Object.keys(definition).length === 0 ? undefined : definition,

			homepage: [...new Set(HomepageColumns.map(column => url(record[column])).flatMap(multiple))],
			mbox: [opt(record["Email"], email)].flatMap(multiple),

			unitOf: [...new Set(values(record["Parent"]).map(parent).flatMap(multiple))],
			institutes: values(record["VI"]).map(institute).flatMap(multiple),

			heads: [opt(record["Head"], name)].flatMap(multiple),

			cues: {
				type: record["Type"],
				topics: topics.length === 0 ? undefined : topics.join("; ")
			}

		});


		function parent(value: string): undefined | string {

			const target = value.toLowerCase();

			const matches = records.filter(candidate => candidate !== record && [
				candidate["Code"],
				candidate["Acronym"],
				candidate["Name (English)"],
				candidate["Name (Local)"]
			].some(label => label?.toLowerCase() === target));

			if ( matches.length === 0 ) {

				logger.warning`no matches for parent unit <${value}>`;

				return undefined;

			} else {

				if ( matches.length > 1 ) {
					logger.warning`multiple matches for parent unit <${value}>`;
				}

				return key(matches[0]);

			}

		}

	}


	function key(record: Record): string {
		return required(record["Code"] ?? record["Name (English)"] ?? record["Name (Local)"]);
	}

	function institute(value: string): undefined | string {

		const match = VirtualInstitutes.find(({ altLabel }) => altLabel.toLowerCase() === value.toLowerCase());

		if ( match === undefined ) {
			logger.warning`unknown virtual institute <${value}>`;
		}

		return match?.id;

	}

	function name(value: string): undefined | Name {
		return opt(NamePattern.exec(value) ?? undefined, ([, familyName, givenName, title]) => immutable({

			title: title?.trim(),
			givenName: givenName.trim(),
			familyName: familyName.trim()

		}));
	}


	function localised(english: undefined | string, local: undefined | string): Dictionary {

		const entries: readonly (readonly [string, undefined | string])[] = [["en", english], [locale, local]];

		return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry[1] !== undefined));

	}

	function values(value: undefined | string): readonly string[] {
		return value
				?.split(ValueSeparator)
				.map(item => item.trim())
				.filter(item => item !== "")
			?? [];
	}

	function url(value: undefined | string): undefined | string {
		return opt(value, value => URL.canParse(value)
			? opt(new URL(value), ({ protocol, href }) => protocol === "http:" || protocol === "https:" ? href : undefined)
			: undefined
		);
	}

	function email(value: string): undefined | string {
		return opt(value.replace(/^mailto:/i, ""), address => EmailPattern.test(address) ? address : undefined);
	}

}
