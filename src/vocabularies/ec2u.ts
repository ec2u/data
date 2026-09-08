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

import { ec2u as base } from "@/index.js";
import { decimal } from "@metreeca/blue/number";
import { id, property, resource } from "@metreeca/blue/resource";
import { iri, markdown, plain } from "@metreeca/blue/string";
import { multiple, optional, required, type State } from "@metreeca/blue/value";
import { createNamespace } from "@metreeca/core/resource";


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

export const wgs = createNamespace("http://www.w3.org/2003/01/geo/wgs84_pos#", [

	"long",
	"lat"

]);


export const LabelLength = 100;
export const CommentLength = 500;

const LatitudeLimit = 90;
const LongitudeLimit = 180;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Entity = State<typeof Entity>
export type Feature = State<typeof Feature>


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

		extends: Entity,

		namespace: wgs

	}, {

		longitude: property({ forward: wgs.long }, required(decimal({
			minInclusive: -LongitudeLimit,
			maxInclusive: LongitudeLimit
		}))),

		latitude: property({ forward: wgs.lat }, required(decimal({
			minInclusive: -LatitudeLimit,
			maxInclusive: LatitudeLimit
		})))

	});
}
