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
import type { Agency, Draft, Name } from "../sinks/sync.js";


const logger = log(import.meta.url);

const ISODatePattern = /^\d{4}-\d{2}-\d{2}$/;
const LocalDatePattern = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/;
const ValidPattern = /^\d{4}(?:\/\d{4})?$/;
const NamePattern = /^([^,]+),([^(]+)(?:\(([^)]+)\))?$/;

const ValueSeparator = ";";

const CSVFormat = immutable({

	header: true,
	skip: true,
	trim: true

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Creates a CSV document loader.
 *
 * Retrieves each sheet and reads it as a CSV table with a header row, blank rows skipped, one document draft per row
 * stating a title in English or in the local language of the university; rows titled in neither are dropped as
 * placeholders. A row is keyed by its `Identifier`, falling back to its English and then to its local title, so
 * retitling a document without an identifier lists it as a new one.
 *
 * Titles, descriptions and publisher names are stated in English and in the local language of `university`, from the
 * `(English)` and `(Local)` column pairs. People are read from `Contact` and from the semicolon-separated
 * `Contributor` list as `Family, Given (Title)`; a related document is named in `Related`, semicolon-separated, by
 * its identifier or either title, matched regardless of case against the other rows of the same sheet. A `License`
 * stating a URL names the license, any other text states the access rights. The `Type` and `Audience` columns are
 * handed on as cues for the classification.
 *
 * Web addresses that do not parse as absolute `http` or `https` URLs, dates in neither ISO nor day-first numeric form,
 * validity periods other than a year or a `YYYY/YYYY` range, names in any other form and related documents matching
 * no row are left out, as is any column without a counterpart in the document model.
 *
 * @param university The university the sheets list documents for, supplying the local language of its columns
 *
 * @returns A task converting a feed of CSV sheet URLs into a feed of document drafts
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
				(filter(record => isDefined(record["Title (English)"] ?? record["Title (Local)"])))
				(toArray())
			);

			return records.map(record => draft(record, records));

		})))
	);


	function draft(record: Record, records: readonly Record[]): Draft {

		const titleEnglish = record["Title (English)"];
		const titleLocal = record["Title (Local)"];

		const description = localised(record["Description (English)"], record["Description (Local)"]);

		const license = record["License"];
		const licenseURL = url(license);

		return immutable({

			id: key(record),

			url: [...new Set([record["URL (English)"], record["URL (Local)"]].map(url).flatMap(multiple))],
			identifier: record["Identifier"],
			language: [opt(titleEnglish, () => "en"), opt(titleLocal, () => locale)].flatMap(multiple),

			title: localised(titleEnglish, titleLocal),
			description: Object.keys(description).length === 0 ? undefined : description,

			creator: opt(record["Contact"], name),
			contributor: values(record["Contributor"]).map(name).flatMap(multiple),
			publisher: agency(record),

			issued: date(record["Issued"]),
			modified: date(record["Modified"]),
			valid: opt(record["Valid"], valid => ValidPattern.test(valid) ? valid : undefined),

			rights: record["Rights"],
			accessRights: licenseURL === undefined ? opt(license, license => ({ en: license })) : undefined, // !!! language
			license: licenseURL,

			relation: [...new Set(values(record["Related"]).map(related).flatMap(multiple))],

			cues: {
				type: record["Type"],
				audience: record["Audience"]
			}

		});


		function related(value: string): undefined | string {

			const target = value.toLowerCase();

			const matches = records.filter(candidate => [
				candidate["Identifier"],
				candidate["Title (English)"],
				candidate["Title (Local)"]
			].some(label => label?.toLowerCase() === target));

			if ( matches.length === 0 ) {

				logger.warning`no matches for related document <${value}>`;

				return undefined;

			} else {

				if ( matches.length > 1 ) {
					logger.warning`multiple matches for related document <${value}>`;
				}

				return key(matches[0]);

			}

		}

	}


	function key(record: Record): string {
		return required(record["Identifier"] ?? record["Title (English)"] ?? record["Title (Local)"]);
	}

	function agency(record: Record): undefined | Agency {

		const name = localised(record["Publisher (English)"], record["Publisher (Local)"]);

		return Object.keys(name).length === 0 ? undefined : immutable({

			name,
			homepage: url(record["Home"])

		});

	}

	function name(value: string): undefined | Name {

		// runs of whitespace, non-breaking spaces included, collapse to a single space, as names admit no other

		const normalised = value.replace(/\s+/g, " ");

		return opt(NamePattern.exec(normalised) ?? undefined, ([, familyName, givenName, title]) => immutable({

			title: title?.trim(),
			givenName: givenName.trim(),
			familyName: familyName.trim()

		}));
	}


	function localised(english: undefined | string, local: undefined | string) {

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

	function date(value: undefined | string): undefined | string {
		return opt(value, value => {

			const local = LocalDatePattern.exec(value);

			return ISODatePattern.test(value) ? value
				: local !== null ? `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}`
					: undefined;

		});
	}

}
