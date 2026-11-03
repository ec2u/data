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

import { dictionary } from "@metreeca/blue/dictionary";
import { id, multiple, optional, required, resource } from "@metreeca/blue/resource";
import { iri, text } from "@metreeca/blue/string";
import { union } from "@metreeca/blue/union";
import type { State } from "@metreeca/blue/value";
import { createNamespace, resolve } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";
import { wgs, WGSPoint } from "@metreeca/work/open/wgs.js";


export const EC2U = "https://ec2u.eu/"; // the EC2U Alliance organization
export const base = "https://data.ec2u.eu/"; // the EC2U Knowledge Hub id space

export const ec2u = createNamespace(resolve(base, "terms#"), [

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
	"version",
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


export const licenses = immutable({

	CCBYNCND40: {

		id: "https://creativecommons.org/licenses/by-nc-nd/4.0/",

		label: "CC BY-NC-ND 4.0",
		comment: { en: "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International" }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const LabelLength = 100;
export const CommentLength = 500;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Entity = State<typeof Entity>
export type Place = State<typeof Place>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Entity() {
	return resource({

		space: rdfs,

		name: "Entity",
		description: "An entity described on the EC2U Knowledge Hub."

	}, {

		id: id(),

		label: required(union(
			text({
				maxLength: LabelLength
			}),
			dictionary({
				uniqueLang: true,
				maxLength: LabelLength
			})
		), {
			description: "Human-readable name identifying the entity."
		}),

		comment: optional(dictionary({
			uniqueLang: true,
			maxLength: CommentLength
		}), {
			description: "Human-readable account of the entity."
		}),

		isDefinedBy: optional(iri, {
			description: "Specification formally defining the entity or its data model."
		}),

		seeAlso: multiple(iri, {
			description: "Further resources describing the same entity."
		})

	});
}

export function Place() {
	return resource(Entity, WGSPoint, {

		space: wgs,

		name: "Place",
		description: "A geographic location identified by its WGS84 coordinates."

	});
}
