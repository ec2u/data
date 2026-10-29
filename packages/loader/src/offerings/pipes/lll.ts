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
import { getTopicId } from "@ec2u/data-shared/taxonomies/index.js";
import { isced2011 } from "@ec2u/data-shared/taxonomies/isced-2011.js";
import { iscedf2013 } from "@ec2u/data-shared/taxonomies/isced-f-2013.js";
import { sdgs } from "@ec2u/data-shared/taxonomies/sdgs.js";
import { stakeholders } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { type University, universities } from "@ec2u/data-shared/universities/index.core.js";
import { opt } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { distinct, flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { csv } from "@metreeca/mime-csv";
import { fetch } from "@metreeca/pipe-url";
import type { Reference } from "@metreeca/qest/state";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type CourseDraft, type Dictionary, type Draft, identify, type Name, type ProgramDraft, sync } from "../sinks/sync.js";


const Source = resolve(base, "/offerings/lll");

const DataURL = "offerings-lll-url";

const Audience = getTopicId(stakeholders, "teaching/students/continuing-education");

const Terms: { readonly [value: string]: NonNullable<CourseDraft["term"]>[number] } = {
	annual: "Annual",
	first: "First",
	second: "Second",
	summer: "Summer",
	open: "Open"
};

const Modes: { readonly [value: string]: NonNullable<CourseDraft["courseMode"]> } = {
	presence: "OfflineEventAttendanceMode",
	online: "OnlineEventAttendanceMode",
	hybrid: "MixedEventAttendanceMode"
};

const Fees: { readonly [value: string]: boolean } = {
	no: true,
	yes: false
};

const Tests: { readonly [value: string]: string } = {
	written: "Written",
	quiz: "Quiz",
	oral: "Oral",
	coursework: "Coursework"
};

const Grades: { readonly [value: string]: string } = {
	vote: "Vote",
	judgement: "Judgement",
	certification: "Certification"
};


const logger = log(import.meta.url);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(LLL);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function LLL() {

	const vault = service(createVault);

	return pipe(
		(items(await vault(DataURL)))
		(fetch())
		(csv({ header: true, skip: true, trim: true }))
		(flat(map(row)))
		(distinct(draft => identify(draft) ?? draft.key))
		(sync(Source))
	);

}


/**
 * Reads a row of the cross-alliance lifelong learning sheet.
 *
 * A row states one course delivered by the partner university named in `University`, keyed by its `Code` or, failing
 * that, by its English or local title, prefixed with `LLL/` so that it never names the same course as another source
 * listing the same code. `Year` and the comma-separated `Term` place the course in its academic period, an `each
 * semester` year standing for a course with no year of its own; titles, provider and program are read from their
 * `(English)` and `(Local)` column pairs, and the free texts as English, the language the sheet states them in.
 *
 * The course is tagged as addressed to continuing education students; its levels are read from `ISCED-2011`, its
 * fields from `ISCED-F 2013` along with their broader fields and its goals from `SDG`. `Badge` is stated as the Open
 * Badge awarded, `Test`, `Grade` and `Scale` as a table of examination requirements, and `Instructor` as the people
 * named `Family, Given`, separated by semicolons. A program named in `Program (English)` or `Program (Local)` is
 * stated as a draft of its own, keyed by name and the course year, and the course links to it.
 *
 * Unrecognised values of the closed-set columns are left out rather than guessed.
 *
 * @param row The row as read from the sheet, keyed by column name
 *
 * @returns The drafts of the course and of the program it names, if any; empty if the row is disabled by a non-blank
 * `-` column, names no partner university, states no title or states a year other than `YYYY/YYYY` or `each semester`
 */
export function row(row: { readonly [column: string]: undefined | string }): readonly Draft[] {

	const university = opt(value("University"), name => universities[resolve(base, `/universities/${name.toLowerCase()}`)]);
	const title = value("Title (English)") ?? value("Title (Local)");
	const year = value("Year");

	if ( value("-") !== undefined ) {

		return [];

	} else if ( university === undefined || title === undefined ) {

		logger.warning`unattributed or untitled row <${value("Code") ?? title}> of <${value("University")}>`;

		return [];

	} else if ( year !== undefined && year !== "each semester" && !/^\d{4}\/\d{4}$/.test(year) ) {

		logger.warning`malformed year <${year}> for row <${value("Code") ?? title}>`;

		return [];

	} else {

		return drafts(university, `LLL/${value("Code") ?? title}`, year === "each semester" ? undefined : year);

	}


	function drafts(university: University, key: string, year: undefined | string): readonly Draft[] {

		const program: undefined | ProgramDraft = opt(named("Program", university), name => immutable({

			kind: "program",

			university,
			key: `LLL/${name.en ?? Object.values(name)[0]}`,
			...opt(year, year => ({ year })),

			name

		}));

		const course: CourseDraft = immutable({

			kind: "course",

			university,
			key,
			...opt(year, year => ({ year })),
			term: listed("Term", Terms),

			name: named("Title", university) ?? {},
			...opt(value("Code"), code => /^\S+$/.test(code) ? { courseCode: code } : {}),
			url: [value("URL (English)") ?? value("URL (Local)")].flatMap(multiple).filter(isWeb),

			...english("Description", "description"),
			...english("Syllabus", "teaches"),
			...english("Prerequisites", "coursePrerequisites"),
			...english("Assessment", "assesses"),
			...opt(examination(), table => ({ competencyRequired: { en: table } })),

			...opt(Modes[value("Mode") ?? ""], courseMode => ({ courseMode })),
			inLanguage: list("Language").filter(tag => /^[a-z]{2}$/.test(tag)),
			...opt(Fees[value("Fee") ?? ""], isAccessibleForFree => ({ isAccessibleForFree })),
			...opt(amount("Credits"), numberOfCredits => ({ numberOfCredits })),
			...opt(opt(amount("Duration"), hours), timeRequired => ({ timeRequired })),
			...opt(opt(amount("Workload"), hours), courseWorkload => ({ courseWorkload })),

			educationalLevel: list("ISCED-2011")
				.filter(code => /^[4-9]$/.test(code))
				.map(code => getTopicId(isced2011, code)),

			about: [
				...[...new Set(list("ISCED-F 2013")
					.filter(code => /^\d{2,4}$/.test(code))
					.flatMap(code => [2, 3, 4].filter(length => length <= code.length).map(length => code.slice(0, length)))
				)].map(code => getTopicId(iscedf2013, code)),
				...list("SDG")
					.filter(code => /^([1-9]|1[0-7])$/.test(code))
					.map(code => getTopicId(sdgs, code))
			],

			audience: [Audience],

			...opt(value("Badge"), badge => isWeb(badge) ? { educationalCredentialAwarded: credential(badge) } : {}),

			...opt(named("Provider", university), name => ({ provider: { name } })),
			instructor: (value("Instructor") ?? "").split(";").map(person).flatMap(multiple),
			inProgram: opt(program, ({ key }) => [{ key, ...opt(year, year => ({ year })) }]) ?? []

		});

		return program === undefined ? [course] : [course, program];

	}


	function value(column: string): undefined | string {
		return opt(row[column]?.trim(), value => value === "" ? undefined : value);
	}

	function list(column: string): readonly string[] {
		return (value(column) ?? "").split(",").map(item => item.trim()).filter(item => item !== "");
	}

	/**
	 * Reads the recognised values of a closed-set column, in the order the set declares them.
	 */
	function listed<V>(column: string, values: { readonly [value: string]: V }): readonly V[] {

		const items = new Set(list(column));

		return Object.entries(values).filter(([item]) => items.has(item)).map(([, value]) => value);

	}

	function named(column: string, { locale }: University): undefined | Dictionary {

		const name: Dictionary = {
			...opt(value(`${column} (English)`), en => ({ en })),
			...opt(value(`${column} (Local)`), local => ({ [locale]: local }))
		};

		return Object.keys(name).length > 0 ? name : undefined;

	}

	function english(column: string, property: string): { readonly [property: string]: Dictionary } {
		return opt(value(column), en => ({ [property]: { en } })) ?? {};
	}

	function amount(column: string): undefined | number {
		return opt(value(column), value => opt(Number.parseFloat(value), amount =>
			Number.isFinite(amount) && amount > 0 ? amount : undefined
		));
	}

	function examination(): undefined | string {

		const rows = [
			["Format", listed("Test", Tests).join(", ")],
			["Grade", listed("Grade", Grades).join(", ")],
			["Scale", opt(value("Scale"), scale => /^(0-\d+|[^/]+(\/[^/]+)+)$/.test(scale) ? scale : undefined) ?? ""]
		].filter(([, value]) => value !== "");

		return rows.length === 0 ? undefined : [
			"| Assessment | Type |\n|---|---|\n",
			...rows.map(([label, value]) => `| ${label} | ${value} |\n`)
		].join("");

	}

}


function person(value: string): undefined | Name {
	return opt(/^([^,]+),([^,]+)$/.exec(value.trim()) ?? undefined, ([, familyName, givenName]) => immutable({
		familyName: familyName.trim(),
		givenName: givenName.trim()
	}));
}

/**
 * States an Open Badge as the credential a course awards.
 */
function credential(badge: string): NonNullable<CourseDraft["educationalCredentialAwarded"]> {
	return immutable({ credentialCategory: "Badge", url: [badge] });
}

function hours(amount: number): string {

	const minutes = Math.round(amount*60);

	return `PT${Math.floor(minutes/60)}H${minutes%60 === 0 ? "" : `${minutes%60}M`}`;

}

function isWeb(url: string): boolean {
	return URL.canParse(url) && /^https?:$/.test(new URL(url).protocol);
}
