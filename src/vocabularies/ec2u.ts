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

import { Point, wgs } from "@/vocabularies/wgs.js";
import { id, resource } from "@metreeca/blue/resource";
import { iri, markdown, plain } from "@metreeca/blue/string";
import { multiple, optional, required } from "@metreeca/blue/value";
import { createNamespace } from "@metreeca/core/resource";


export const base = "https://data.ec2u.eu";

export const ec2u = createNamespace(`${base}/terms#`, [

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

		namespace: rdfs

	}, {

		id: id(),

		label: required(plain({
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
	return resource({

		extends: [Entity, Point],

		namespace: wgs

	}, {

	});
}
