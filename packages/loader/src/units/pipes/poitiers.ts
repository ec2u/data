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

import { poitiers } from "@ec2u/data-shared/universities/index.core.js";
import { isAny, isArray, isObject, isString, key, opt, type URLLike } from "@metreeca/core";
import { multiple } from "@metreeca/core/arrays";
import { immutable } from "@metreeca/core/values";
import { pipe, type Task } from "@metreeca/flow";
import { items } from "@metreeca/flow/feeds";
import { flat, map } from "@metreeca/flow/tasks";
import { fetch } from "@metreeca/pipe-url";
import { log } from "@metreeca/tape";
import { execute } from "../../index.core.js";
import { type Draft, type Name, sync } from "../sinks/sync.js";


const DataURL = "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets"
	+"/fr-esr-structures-recherche-publiques-actives/exports/json"
	+"?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles";


const logger = log(import.meta.url);


/**
 * A research structure as the RNSR export describes it.
 *
 * Its identifier and name are always stated; its other facts may be missing or `null`, but are never malformed.
 */
type Structure = {

	readonly numero_national_de_structure: string

	readonly libelle: string
	readonly sigle?: null | string

	readonly site_web?: null | string
	readonly fiche_rnsr?: null | string

	readonly type_de_structure?: null | string
	readonly domaine_scientifique?: null | readonly string[]

	readonly numero_de_structure_parent?: null | readonly string[]

	readonly prenom_du_responsable?: null | readonly string[]
	readonly nom_du_responsable?: null | readonly string[]

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

if ( import.meta.main ) {
	await execute(Poitiers);
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export async function Poitiers() {

	return pipe(
		(items(DataURL))
		(structures())
		(sync(poitiers))
	);

}


/**
 * Creates a reader of the research structures Poitiers University supervises.
 *
 * Retrieves each export of the French national register of research structures (RNSR) and reads it as a JSON array,
 * one unit draft per structure, keyed by its national structure number. Names are stated in French, as the register
 * states them; the acronym, the website and the register record are carried over, and the people in charge of a
 * structure are stated as its heads, from the paired forename and surname lists.
 *
 * A parent structure is resolved only when the same export lists it, so a structure whose parent belongs to another
 * institution stands directly under the university. The structure type and the scientific domains are handed on
 * unchanged, as cues guiding the classification of the unit against the EC2U organisation taxonomy and EuroSciVoc.
 *
 * An export that fails to be retrieved yields no drafts at all, and a structure stating no number or name, or any
 * malformed fact, is logged and dropped, so a malformed record costs only itself rather than the whole export.
 *
 * @returns A task converting a feed of RNSR JSON export URLs into a feed of unit drafts
 */
function structures(): Task<URLLike, Draft> {

	const { locale } = poitiers;

	return urls => pipe(
		(items(urls))
		(fetch())
		(flat(map(async response => {

			const json: unknown = await response.json();

			const structures = isArray(json) ? json.filter((record): record is Structure => {

				if ( isStructure(record) ) {

					return true;

				} else {

					logger.warning`malformed structure <${JSON.stringify(record)}>`;

					return false;

				}

			}) : [];

			const listed = new Set(structures.map(structure => structure.numero_national_de_structure));

			return structures.map(structure => draft(structure, listed));

		})))
	);


	function draft({

		numero_national_de_structure: id,

		libelle,
		sigle,

		site_web,
		fiche_rnsr,

		type_de_structure,
		domaine_scientifique,

		numero_de_structure_parent,

		prenom_du_responsable,
		nom_du_responsable

	}: Structure, listed: ReadonlySet<string>): Draft {

		const domains = domaine_scientifique ?? [];
		const forenames = prenom_du_responsable ?? [];

		return immutable({

			id,

			identifier: id,
			isDefinedBy: url(fiche_rnsr),

			prefLabel: { [locale]: libelle },
			altLabel: sigle ?? undefined,

			homepage: [url(site_web)].flatMap(multiple),
			mbox: [],

			unitOf: (numero_de_structure_parent ?? []).filter(parent => listed.has(parent)),
			institutes: [],

			heads: (nom_du_responsable ?? []).map((familyName, index): undefined | Name => opt(forenames[index],
				givenName => immutable({ givenName: givenName.trim(), familyName: familyName.trim() })
			)).flatMap(multiple),

			cues: {
				type: type_de_structure ?? undefined,
				topics: domains.length === 0 ? undefined : domains.join("; ")
			}

		});

	}


	function isStructure(value: unknown): value is Structure {
		return isObject(value, {
			numero_national_de_structure: isString,
			libelle: isString,
			sigle: sigle => isAbsent(sigle) || isString(sigle),
			site_web: site => isAbsent(site) || isString(site),
			fiche_rnsr: record => isAbsent(record) || isString(record),
			type_de_structure: type => isAbsent(type) || isString(type),
			domaine_scientifique: domains => isAbsent(domains) || isArray(domains, isString),
			numero_de_structure_parent: parents => isAbsent(parents) || isArray(parents, isString),
			prenom_du_responsable: names => isAbsent(names) || isArray(names, isString),
			nom_du_responsable: names => isAbsent(names) || isArray(names, isString),
			[key]: isAny
		});
	}

	function isAbsent(value: unknown): value is undefined | null {
		return value === undefined || value === null;
	}

	function url(value: undefined | null | string): undefined | string {
		return isAbsent(value) || !URL.canParse(value) ? undefined
			: opt(new URL(value), ({ protocol, href }) => protocol === "http:" || protocol === "https:" ? href : undefined);
	}

}
