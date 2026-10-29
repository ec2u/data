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

import { salamanca } from "@ec2u/data-shared/universities/index.core.js";
import { isAny, isArray, isNumber, isObject, isString, key, opt } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { toArray } from "@metreeca/flow/sinks";
import { distinct, flat, map } from "@metreeca/flow/tasks";
import { service } from "@metreeca/gear";
import { createVault } from "@metreeca/gear/vault";
import { csv } from "@metreeca/mime-csv";
import { fetch } from "@metreeca/pipe-url";
import type { Reference } from "@metreeca/qest/state";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { VirtualInstitutes } from "../index.core.js";
import { type Draft, type Name, sync } from "../sinks/sync.js";


const DataURL = "units-salamanca-url";
const DataKey = "units-salamanca-key";
const MembershipsURL = "units-salamanca-vis-url";

const GroupType = "Grupo de Investigación Reconocido";
const InstituteType = "Instituto Universitario de Investigación";

const NamePattern = /^([^,]+),([^,]+)$/;


const logger = log(import.meta.url);


/**
 * A recognised research group as the Salamanca units API describes it.
 *
 * The identifier is mostly a string, once a number, and the name is always stated; every other field is a string,
 * possibly empty, or `null`. The institutes a group belongs to are listed in one comma-separated field, and so are
 * their web addresses, in the same order, so the address of each institute stands at the position of its name.
 */
type Group = {

	readonly id: string | number

	readonly name: string
	readonly acronym: null | string
	readonly topics: null | string

	readonly knowledge_branch: null | string
	readonly RIS3: null | string

	readonly group_scientific_portal_url: null | string

	readonly institute: null | string
	readonly institute_webusal_url: null | string

	readonly head: null | string

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Salamanca);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Salamanca() {

	const vault = service(createVault);

	const authorization = `Basic ${Buffer.from(await vault(DataKey)).toString("base64")}`;

	return pipe(
		(items(new Request(await vault(DataURL), { headers: { Authorization: authorization } })))
		(groups(await memberships(await vault(MembershipsURL))))
		(sync(salamanca))
	);

}


/**
 * Retrieves the virtual institutes Salamanca research groups take part in.
 *
 * Reads the curated membership sheet, one row per membership, and keeps the rows marked as active whose `Code` names
 * a group by its API identifier and whose `VI` names an EC2U virtual institute by its acronym. A sheet that fails to be
 * retrieved yields no memberships, so the groups are stated without their virtual institutes rather than not at all.
 *
 * @param url The address of the membership sheet, published as CSV
 *
 * @returns A promise resolving to the identifiers of the virtual institutes each group takes part in, keyed by the API
 * identifier of the group; groups the sheet lists no active membership for are absent from the map
 */
async function memberships(url: string): Promise<ReadonlyMap<string, readonly Reference[]>> {

	const records = await pipe(
		(items(url))
		(fetch())
		(csv({ header: true, skip: true, trim: true }))
		(toArray())
	);

	const entries = records.filter(({ Active }) => Active === "TRUE").flatMap(({ Code, VI }): readonly {

		readonly code: string
		readonly institute: Reference

	}[] => {

		const institute = VirtualInstitutes.find(({ altLabel }) => altLabel.toLowerCase() === VI?.toLowerCase());

		if ( Code === undefined || institute === undefined ) {
			logger.warning`unknown membership <${Code}> of <${VI}>`;
		}

		return Code === undefined || institute === undefined ? [] : [{ code: Code, institute: institute.id }];

	});

	return new Map([...new Set(entries.map(({ code }) => code))].map(code =>
		[code, entries.filter(entry => entry.code === code).map(({ institute }) => institute)]
	));

}

/**
 * Creates a reader of the recognised research groups listed by the Salamanca units API.
 *
 * Retrieves each listing and reads it as a JSON array, one unit draft per group, keyed by its identifier in the API;
 * the listing repeats some groups, so each group is stated once. Names and topics are stated in Spanish, the topics
 * standing as the description, along with the acronym, the scientific portal page and the head, named as
 * `Family, Given`. The institutes a group belongs to are stated as units of their own, keyed by their name, under the
 * university, with the group under them; a group belonging to no institute stands directly under the university. The
 * virtual institutes a group takes part in are taken from `memberships`. The knowledge branch and the RIS3 priority
 * area are handed on as cues guiding the classification against EuroSciVoc, along with the type of recognised group.
 *
 * A listing that fails to be retrieved, or that answers with anything other than an array, yields no drafts at all; a
 * group stating no name, or any malformed fact, is logged and dropped, so it costs only itself rather than the listing.
 *
 * @param memberships The identifiers of the virtual institutes each group takes part in, keyed by group identifier
 *
 * @returns A task converting a feed of API requests into a feed of unit drafts
 */
function groups(memberships: ReadonlyMap<string, readonly Reference[]>): Task<Request, Draft> {

	return requests => pipe(
		(items(requests))
		(fetch())
		(flat(map(async response => {

			const json: unknown = await response.json();

			if ( isArray(json) ) {

				return json.filter((record): record is Group => {

					if ( isGroup(record) ) {

						return true;

					} else {

						logger.warning`malformed group <${JSON.stringify(record)}>`;

						return false;

					}

				});

			} else {

				logger.error`unexpected response <${JSON.stringify(json)}>`;

				return [];

			}

		})))
		(distinct(({ id }) => String(id)))
		(flat(map(group => [draft(group), ...institutes(group)])))
		(distinct(({ id }) => id))
	);


	function draft({

		id,

		name,
		acronym,
		topics,

		knowledge_branch,
		RIS3,

		group_scientific_portal_url,

		institute,

		head

	}: Group): Draft {

		const code = String(id);
		const description = opt(topics ?? undefined, topics => topics.replace(/\r\n?/g, "\n").trim() || undefined);
		const cues = [knowledge_branch, RIS3].map(text).flatMap(multiple);

		return immutable({

			id: code,

			identifier: code,

			prefLabel: { [salamanca.locale]: name.replace(/\s+/g, " ").trim() },
			altLabel: text(acronym),
			definition: opt(description, description => ({ [salamanca.locale]: description })),

			homepage: [url(group_scientific_portal_url)].flatMap(multiple),
			mbox: [],

			unitOf: names(institute),
			institutes: memberships.get(code) ?? [],

			heads: [opt(text(head), person)].flatMap(multiple),

			cues: {
				type: GroupType,
				topics: cues.length === 0 ? undefined : cues.join("; ")
			}

		});

	}

	function institutes({ institute, institute_webusal_url }: Group): readonly Draft[] {

		const homepages = (institute_webusal_url ?? "").split(",").map(url);

		return names(institute).map((name, index) => immutable({

			id: name,

			prefLabel: { [salamanca.locale]: name },

			homepage: [homepages[index]].flatMap(multiple),
			mbox: [],

			unitOf: [],
			institutes: [],

			heads: [],

			cues: {
				type: InstituteType
			}

		}));

	}


	function isGroup(value: unknown): value is Group {
		return isObject(value, {
			id: id => isString(id) || isNumber(id),
			name: name => isString(name) && name.trim() !== "",
			acronym: nullable,
			topics: nullable,
			knowledge_branch: nullable,
			RIS3: nullable,
			group_scientific_portal_url: nullable,
			institute: nullable,
			institute_webusal_url: nullable,
			head: nullable,
			[key]: isAny
		});
	}

	function nullable(value: unknown): value is null | string {
		return value === null || isString(value);
	}

}


/**
 * Splits a comma-separated list of institutes, where institute names may hold commas of their own but always open with
 * `Instituto`, so only a comma followed by that word separates two entries of the list.
 */
function names(value: null | string): readonly string[] {
	return (value ?? "").split(/,\s*(?=Instituto)/).map(text).flatMap(multiple);
}

function person(value: string): undefined | Name {
	return opt(NamePattern.exec(value) ?? undefined, ([, familyName, givenName]) => immutable({

		givenName: givenName.trim(),
		familyName: familyName.trim()

	}));
}

function text(value: null | string): undefined | string {

	// runs of whitespace collapse to a single space, so the API's stray line breaks never reach the store

	const normalised = (value ?? "").replace(/\s+/g, " ").trim();

	return normalised === "" ? undefined : normalised;

}

function url(value: null | string): undefined | string {
	return opt(text(value), value => URL.canParse(value)
		? opt(new URL(value), ({ protocol, href }) => protocol === "http:" || protocol === "https:" ? href : undefined)
		: undefined
	);
}
