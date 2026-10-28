/*
 * Copyright © 2025-2026 Metreeca srl
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

import { base, EC2U, ec2u } from "@ec2u/data-shared";
import { datasets, licenses } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { EuroSciVocTopic } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import { dcat } from "@ec2u/data-shared/vocabularies/dcat.js";
import { dct } from "@ec2u/data-shared/vocabularies/dct.js";
import { OrgOrganizationalUnit } from "@ec2u/data-shared/vocabularies/org.js";
import { reference } from "@metreeca/blue/reference";
import { multiple, nonempty, optional, resource } from "@metreeca/blue/resource";
import { string, text } from "@metreeca/blue/string";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";
import * as uuid from "uuid";


export const units = immutable({

	id: resolve(base, "/units/"),

	isDefinedBy: resolve(base, "/datasets/units"),
	dataset: datasets.id,

	label: "EC2U Units",

	title: { en: "EC2U Research Units and Facilities" },
	alternative: { en: "EC2U Units" },
	description: { en: "Information about research units and supporting structures at EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	issued: "2022-01-01"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Units() {
	return resource(Dataset, {

		name: "Units",
		description: "Information about research units and supporting structures at EC2U partner universities."

	}, {

		resources: multiple(reference(Unit))

	});
}

export function Unit() {
	return resource(Organization, OrgOrganizationalUnit, {

		space: ec2u,
		class: ec2u.Unit,

		name: "Unit",
		description: "A research unit or supporting structure at an EC2U partner university."

	}, {

		unitOf: nonempty(reference(Organization)),

		subject: multiple(reference(EuroSciVocTopic), { forward: dct }),
		keyword: multiple(text, { forward: dcat }),

		digest: optional(string, {

			hidden: true,

			forward: ec2u,

			name: "Source Digest",
			description: "A unique identification of the content the source entry carried when it was read."

		})

	});
}


/**
 * Identifies a unit listed by a partner university.
 *
 * The same key always names the same unit within a university, so that a listing re-read on a later run restates the
 * units it already stood for, while equal keys listed by different universities never name the same unit.
 *
 * @param university The identifier of the university listing the unit
 * @param key The key the listing names the unit with
 *
 * @returns The identifier of the unit listed under `key` by `university`
 */
export function getUnitId(university: Reference, key: string): Reference {

	return resolve(units.id, uuid.v3(key, uuid.v3(university, uuid.v3.URL)));

}
