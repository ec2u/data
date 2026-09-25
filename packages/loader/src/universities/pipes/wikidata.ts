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
import { opt, type Optional } from "@metreeca/core";
import { fill } from "@metreeca/core/strings";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { createFetch } from "@metreeca/http";
import { headers } from "@metreeca/http/headers";
import { lexical } from "@metreeca/trio";
import { type SPARQL, type Tuple, variable } from "@metreeca/wire-sparql";
import { createHTTPRepository } from "@metreeca/wire-sparql-http";
import { reference } from "@metreeca/wire-sparql/builder";
import { file } from "@metreeca/work/gear/files.js";
import { WGSPoint } from "@metreeca/work/open/wgs.js";
import { delta, persist } from "@metreeca/work/tide-store/persist.js";
import { validate } from "@metreeca/work/tide-store/validate.js";
import { execute } from "../../index.core.js";


if ( import.meta.main ) {
	await execute(Wikidata);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const WikidataEndpoint = "https://query.wikidata.org/sparql";
const WikidataAgent = "EC2U Knowledge Hub (https://data.ec2u.eu/)";

const wikidata = createHTTPRepository({
	query: WikidataEndpoint,
	fetch: createFetch(headers({ "User-Agent": WikidataAgent })) // required by the Wikidata usage policy
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Wikidata() {

	return pipe(
		(items(file(".ql", import.meta.url)))
		(map(bind))
		(flat(map(query => wikidata.select(query))))
		(map(enrich))
		(validate(University))
		(map(university => delta(university.id, University, university)))
		(persist({ atomic: true }))
	);


	function bind(query: SPARQL): SPARQL {
		return fill(query, {

			universities: Object.entries(seeds)
				.flatMap(([id, { seeAlso }]) => seeAlso.map(entity => `(${reference(id)} ${reference(entity)})`))
				.join("\n")

		});
	}

	function enrich(tuple: Tuple): unknown {

		const id = lexical(tuple[variable("id")]);
		const seed = seeds[id as keyof typeof seeds]; // ;(ids are bound from the seed keys)

		return {

			label: seed.prefLabel,

			dataset: universities.id,

			inception: year(tuple),
			students: number(tuple),

			...point(tuple, "coordinates"),

			city: place(tuple, "city"),
			country: place(tuple, "country"),

			...seed,

			id

		};

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function year(tuple: Tuple): Optional<string> {
	return value(tuple, "inception")?.slice(0, 4);
}

function number(tuple: Tuple): Optional<number> {
	return opt(value(tuple, "students"), Number);
}

function place(tuple: Tuple, name: string): Optional<Partial<Place>> {
	return opt(value(tuple, name), id => ({
		id,
		label: value(tuple, `${name}Name`),
		...point(tuple, `${name}Coordinates`)
	}));
}

function point(tuple: Tuple, variable: string): Optional<WGSPoint> {
	return opt(value(tuple, variable), WGSPoint.from);
}

function value(tuple: Tuple, name: string): Optional<string> {
	return opt(tuple[variable(name)], lexical);
}
