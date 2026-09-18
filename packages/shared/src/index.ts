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

import { wgs, WGSPoint } from "@ec2u/data-shared/vocabularies/wgs.js";
import { id, multiple, optional, required, resource } from "@metreeca/blue/resource";
import { iri, markdown, string, text } from "@metreeca/blue/string";
import { createNamespace } from "@metreeca/core/resource";


export const EC2U = "https://ec2u.eu/"; // the EC2U Alliance organization
export const base = "https://data.ec2u.eu"; // the EC2U Knowledge Hub id space

export const ec2u = createNamespace(`${base}/terms#`, [

	"Page",
	"Resource",
	"Dataset",
	"University",
	"Organization",
	"Person",
	"Unit",
	"Taxonomy",
	"Topic",
	"Event",
	"Document",
	"Program",
	"Course",
	"Offering",

	"generated",
	"source",
	"digest",
	"embedding",

	"year",
	"term",
	"inProgram",

	"inception",
	"students",

	"city",
	"country",

	"dataset",
	"resource",

	"university"

]);

export const rdfs = createNamespace("http://www.w3.org/2000/01/rdf-schema#", [

	"label",
	"comment",

	"isDefinedBy",
	"seeAlso",

	"member"

]);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const LabelLength = 100;
export const CommentLength = 500;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Entity() {
	return resource({

		space: rdfs

	}, {

		id: id(),

		label: required(text({
			maxLength: LabelLength
		})),

		comment: optional(markdown({
			maxLength: CommentLength
		})),

		isDefinedBy: optional(iri),
		seeAlso: multiple(iri)

	});
}

export function Feature() {
	return resource(Entity, WGSPoint, {

		space: wgs

	}, {});
}

export function Page() {
	return resource({

		space: ec2u,
		class: ec2u.Page

	}, {

		id: id(),

		source: required(iri, {

			name: "Page Source",
			description: "The data source whose crawl reached the page."

		}),

		digest: required(string, {

			name: "Page Digest",
			description: "A unique identification of the content the page carried when it was read."

		})

	});
}
