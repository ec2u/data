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

import { base, EC2U, ec2u, Entity, licenses } from "@ec2u/data-shared";
import { Dataset } from "@ec2u/data-shared/datasets/index.js";
import { Organization } from "@ec2u/data-shared/organizations/index.js";
import { Resource } from "@ec2u/data-shared/resources/index.js";
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

	dataset: base,

	label: "EC2U Documents",

	title: { en: "EC2U Institutional Documents" },
	alternative: { en: "EC2U Documents" },
	description: { en: "Regulations, policies and other governance documents shared by EC2U partner universities." },

	publisher: EC2U,

	rights: "Copyright © 2022-2025 EC2U Alliance",
	license: [licenses.CCBYNCND40.id],

	created: "2023-07-12",
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

			forward: schema,

			description: "Web addresses of the online versions of the document."

		}),

		identifier: optional(text, {
			description: "Formal identifier assigned to the document by its publisher."
		}),

		language: multiple(tag, {
			description: "Languages the document is written in."
		}),

		title: required(dictionary({ uniqueLang: true }), {
			description: "Official title of the document."
		}),

		description: optional(dictionary({ uniqueLang: true }), {
			description: "Summary of the content of the document."
		}),

		creator: optional(reference(Person), {
			description: "Person primarily responsible for the content of the document."
		}),

		contributor: multiple(reference(Person), {
			description: "Other persons who contributed to the content of the document."
		}),

		publisher: optional(reference(Organization), {
			description: "Organization responsible for issuing the document."
		}),

		created: optional(date, {
			description: "Date of creation of the document."
		}),

		issued: optional(date, {
			description: "Date of formal issuance of the document."
		}),

		modified: optional(date, {
			description: "Date of the latest modification of the document."
		}),

		valid: optional(text, {
			description: "Period during which the document is in force."
		}),

		rights: optional(text, {
			description: "Statement of the copyright held over the document."
		}),

		accessRights: optional(dictionary({ uniqueLang: true }), {
			description: "Statement of who may access the document and under which conditions."
		}),

		license: optional(reference(Entity), {
			description: "Legal document granting permission to use the document."
		}),

		type: multiple(reference(DocumentTopic), {

			forward: dct.type,

			description: "Categories of governance document the document falls under."

		}),

		subject: multiple(reference(EuroSciVocTopic), {
			description: "Topics the document is about."
		}),

		audience: multiple(reference(StakeholderTopic), {
			description: "Stakeholder groups the document is intended for."
		}),

		relation: multiple(reference(Document), {
			description: "Other documents the document is related to."
		}),

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
