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

import type { Place } from "@ec2u/data-shared";
import { universities, University } from "@ec2u/data-shared/universities/index.js";
import seeds from "@ec2u/data-shared/universities/index.json" with { type: "json" };
import { WGSPoint } from "@metreeca/work/open/wgs.js";
import type { Instance } from "@metreeca/blue/value";
import { isDefined, type Optional } from "@metreeca/core";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { batch, flat, map } from "@metreeca/flow/tasks";
import { createFetch } from "@metreeca/http";
import { headers } from "@metreeca/http/headers";
import { lexical } from "@metreeca/trio";
import type { Tuple } from "@metreeca/wire-sparql";
import { createHTTPRepository } from "@metreeca/wire-sparql-http";
import { file } from "@metreeca/work/gear/files.js";
import { delta, persist } from "@metreeca/work/tide-store/persist.js";
import { validate } from "@metreeca/work/tide-store/validate.js";
import { execute } from "../../index.core.js";


const WikidataEndpoint = "https://query.wikidata.org/sparql";
const WikidataAgent = "EC2U Knowledge Hub (https://data.ec2u.eu/)";


type Partner = typeof seeds[keyof typeof seeds];


const wikidata = createHTTPRepository({
	query: WikidataEndpoint,
	fetch: createFetch(headers({ "User-Agent": WikidataAgent })) // required by the Wikidata usage policy
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Wikidata);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Wikidata() {

	return pipe(
		(items(Object.values(seeds)))
		(enrich())
		(validate(University))
		(map(university => delta(university.id, University, university)))
		(persist({ atomic: true }))
	);

}


/**
 * Completes each partner university with the inception year, student count, coordinates, city and country stated by
 * its Wikidata entity.
 *
 * Facts are retrieved by the SPARQL select in the sibling `wikidata.ql` file, ported from the `Universities.qlt` query
 * of the legacy data project, with city and country names in English only. Its `{universities}` placeholder is filled
 * with the IRIs of the Wikidata entities, one `<…>` per line. A property stating several values yields a solution per
 * value, so solutions are grouped by `?university` before merging, keeping the earliest inception year, the largest
 * student count and the first city and country. A partner whose entity lacks any of these facts is dropped.
 */
function enrich(): Task<Partner, University> {

	return partners => pipe(
		(partners)
		(batch())
		(map(async partners => items(await retrieve(partners))))
		(flat())
	);

}

async function retrieve(partners: readonly Partner[]): Promise<readonly University[]> {

	const query = (await file(".ql", import.meta.url)).replace("{universities}", partners
		.map(partner => `<${entity(partner)}>`)
		.join("\n")
	);

	const tuples = await wikidata.select(query);

	return partners.flatMap(partner => merge(partner, tuples.filter(tuple =>
		values([tuple], "university").includes(entity(partner))
	)) ?? []);

}

function merge(partner: Partner, tuples: readonly Tuple[]): undefined | University {

	const years = values(tuples, "inception").map(inception => inception.slice(0, 4));
	const counts = values(tuples, "students").map(Number);

	const inception = years.length > 0 ? years.reduce((x, y) => x < y ? x : y) : undefined;
	const students = counts.length > 0 ? Math.max(...counts) : undefined;
	const coordinates = values(tuples, "coordinates").map(WGSPoint.from)[0];
	const city = feature(tuples, "city");
	const country = feature(tuples, "country");

	const [depiction, ...depictions] = partner.depiction;
	const [homepage, ...homepages] = partner.homepage;

	return depiction && homepage && inception && students !== undefined && coordinates && city && country ? {

		...partner,
		...coordinates,

		label: partner.prefLabel,
		dataset: universities.id,

		depiction: [depiction, ...depictions],
		homepage: [homepage, ...homepages],

		inception,
		students,

		city,
		country

	} : undefined;

}


function entity(partner: Partner): string {
	return partner.seeAlso[0] ?? "";
}

function values(tuples: readonly Tuple[], variable: string): readonly string[] {
	return [...new Set(tuples
		.map(tuple => tuple[`?${variable}`])
		.filter(term => isDefined(term))
		.map(lexical)
	)];
}


function feature(tuples: readonly Tuple[], variable: string): Optional<Instance<typeof Place>> {

	const [id] = values(tuples, variable);
	const [label] = values(tuples, `${variable}Name`);
	const coordinates = values(tuples, `${variable}Coordinates`).map(WGSPoint.from)[0];

	return id && label && coordinates ? { id, label, ...coordinates } : undefined;

}
