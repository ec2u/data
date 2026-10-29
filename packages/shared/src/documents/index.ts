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

import { base, EC2U, ec2u, Entity } from "@ec2u/data-shared";
import { datasets, licenses } from "@ec2u/data-shared/datasets/index.core.js";
import { Dataset, Resource } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { Person } from "@ec2u/data-shared/persons/index.js";
import { DocumentTopic } from "@ec2u/data-shared/taxonomies/documents.js";
import { EuroSciVocTopic } from "@ec2u/data-shared/taxonomies/euroscivoc.js";
import { StakeholderTopic } from "@ec2u/data-shared/taxonomies/stakeholders.js";
import { dct } from "@ec2u/data-shared/vocabularies/dct.js";
import { schema } from "@ec2u/data-shared/vocabularies/schema/index.js";
import { dictionary } from "@metreeca/blue/dictionary";
import { reference } from "@metreeca/blue/reference";
import { multiple, optional, required, resource } from "@metreeca/blue/resource";
import { date, iri, string, tag, text } from "@metreeca/blue/string";
import type { State } from "@metreeca/blue/value";
import { resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";
import * as uuid from "uuid";


export const documents = immutable({

	id: resolve(base, "/documents/"),

	isDefinedBy: resolve(base, "/datasets/documents"),
	dataset: datasets.id,

	label: "EC2U Documents",

	title: { en: "EC2U Institutional Documents" },
	alternative: { en: "EC2U Documents" },
	description: { en: "Regulations, policies and other governance documents shared by EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	issued: "2023-07-15"

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Documents = State<typeof Documents>;
export type Document = State<typeof Document>;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Documents() {
	return resource(Dataset, {

		name: "Documents",
		description: "Regulations, policies and other governance documents shared by EC2U partner universities."

	}, {

		resources: multiple(reference(Document))

	});
}

export function Document() {
	return resource(Resource, {

		space: dct,
		class: ec2u.Document,

		name: "Document",
		description: "A regulation, policy or other governance document shared by an EC2U partner university."

	}, {

		url: multiple(iri, {

			forward: schema

		}),

		identifier: optional(text),
		language: multiple(tag),

		title: required(dictionary({ uniqueLang: true })),
		description: optional(dictionary({ uniqueLang: true })),

		creator: optional(reference(Person)),
		contributor: multiple(reference(Person)),
		publisher: optional(reference(Organization)),

		created: optional(date),
		issued: optional(date),
		modified: optional(date),

		valid: optional(text),

		rights: optional(text),
		accessRights: optional(dictionary({ uniqueLang: true })),
		license: optional(reference(Entity)),

		type: multiple(reference(DocumentTopic), {

			forward: dct.type

		}),

		subject: multiple(reference(EuroSciVocTopic)),
		audience: multiple(reference(StakeholderTopic)),

		relation: multiple(reference(Document)),

		digest: required(string, {

			forward: ec2u,

			hidden: true,

			name: "Source Digest",
			description: "A unique identification of the content the source entry carried when it was read."

		})

	});
}


/**
 * Identifies a document listed by a partner university.
 *
 * The same key always names the same document within a university, so that a listing re-read on a later run restates
 * the documents it already stood for, while equal keys listed by different universities never name the same document.
 *
 * @param university The identifier of the university listing the document
 * @param key The key the listing names the document with
 *
 * @returns The identifier of the document listed under `key` by `university`
 */
export function getDocumentId(university: Reference, key: string): Reference {

	return resolve(documents.id, uuid.v3(key, uuid.v3(university, uuid.v3.URL)));

}
