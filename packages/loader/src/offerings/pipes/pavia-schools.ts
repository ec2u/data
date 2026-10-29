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
import { pavia } from "@ec2u/data-shared/universities/index.core.js";
import { opt, type Optional } from "@metreeca/core";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { pipe } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { focus, html, untag } from "@metreeca/mime-xml";
import { fetch } from "@metreeca/pipe-url";
import { denoise } from "@metreeca/work/mime-xml/denoise.js";
import { execute } from "../../index.core.js";
import { type Dictionary, type ProgramDraft, sync } from "../sinks/sync.js";
import { type Listed, schools } from "./pavia-schools.core.js";


const Source = resolve(base, "/offerings/pavia-schools");

const IndexURLs = [
	"https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici",
	"https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici"
];


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(PaviaSchools);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Harvests the medical specialisation schools listed by Pavia University.
 *
 * Reads by model every school the two listing pages describe, for medical and for non-medical graduates, and states
 * them as programs. A listing page that fails to load or to be read is logged and lists no school, leaving the
 * retraction floor to keep the schools it used to list from being retracted wholesale.
 *
 * @returns A promise resolving to a tally of what the run did
 */
export async function PaviaSchools() {
	return pipe(
		(items(IndexURLs))
		(fetch())
		(html())
		(denoise())
		(focus())
		(untag())
		(schools())
		(flat(map(listed => opt(school(listed), draft => [draft]) ?? [])))
		(sync(Source))
	);
}


/**
 * Drafts a specialisation school a listing page describes.
 *
 * The school is keyed and named in Italian as `Scuola di Specializzazione in` its listed name, stated at ISCED 2011
 * level 8 and awarding the `Diploma di Specializzazione` degree; its summary, contents, learning outcomes, admission
 * and completion requirements are stated in Italian, the language of the listing pages, leaving out blank ones.
 *
 * @param listed The school as the listing page describes it
 *
 * @returns The draft of the school, or `undefined` if its name is blank
 */
export function school({
	name,
	summary,
	contents,
	outcomes,
	prerequisites,
	requirements
}: Listed): Optional<ProgramDraft> {

	const local = (value: Optional<string>): Optional<Dictionary> => opt(value?.trim(), value =>
		value === "" ? undefined : { [pavia.locale]: value }
	);

	const title = name.trim();
	const key = `Scuola di Specializzazione in ${title}`;

	return title === "" ? undefined : immutable({

		kind: "program",

		university: pavia,
		key,

		generated: true, // read by model from the listing pages

		name: { [pavia.locale]: key },

		...opt(local(summary), disambiguatingDescription => ({ disambiguatingDescription })),
		...opt(local(contents), teaches => ({ teaches })),
		...opt(local(outcomes), assesses => ({ assesses })),
		...opt(local(prerequisites), programPrerequisites => ({ programPrerequisites })),
		...opt(local(requirements), competencyRequired => ({ competencyRequired })),

		educationalLevel: [getTopicId(isced2011, "8")],
		educationalCredentialAwarded: { credentialCategory: "Degree", name: { [pavia.locale]: "Diploma di Specializzazione" } }

	});

}
