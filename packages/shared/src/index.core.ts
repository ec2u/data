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
import { assert, isDefined } from "@metreeca/core";
import { unique } from "@metreeca/core/arrays";
import type { Tag } from "@metreeca/core/language";
import { createNamespace, resolve } from "@metreeca/core/resource";
import { dedent } from "@metreeca/core/strings";
import { immutable } from "@metreeca/core/values";
import type { Reference } from "@metreeca/qest/state";
import { geo, WGSPoint } from "@metreeca/work/open/geo.js";


export const LabelLength = 100;
export const CommentLength = 500;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const coimbra = immutable({
	id: resolve(base, "/universities/coimbra"),
	locale: "pt",
	zone: "Europe/Lisbon",
	color: "#228B22"
});

export const iasi = immutable({
	id: resolve(base, "/universities/iasi"),
	locale: "ro",
	zone: "Europe/Bucharest",
	color: "#00A1C9"
});

export const jena = immutable({
	id: resolve(base, "/universities/jena"),
	locale: "de",
	zone: "Europe/Berlin",
	color: "#A6935F"
});

export const linz = immutable({
	id: resolve(base, "/universities/linz"),
	locale: "de",
	zone: "Europe/Vienna",
	color: "#7D828C"
});

export const pavia = immutable({
	id: resolve(base, "/universities/pavia"),
	locale: "it",
	zone: "Europe/Rome",
	color: "#A6223C"
});

export const poitiers = immutable({
	id: resolve(base, "/universities/poitiers"),
	locale: "fr",
	zone: "Europe/Paris",
	color: "#153142"
});

export const salamanca = immutable({
	id: resolve(base, "/universities/salamanca"),
	locale: "es",
	zone: "Europe/Madrid",
	color: "#D22020"
});

export const turku = immutable({
	id: resolve(base, "/universities/turku"),
	locale: "fi",
	zone: "Europe/Helsinki",
	color: "#004A43"
});

export const umea = immutable({
	id: resolve(base, "/universities/umea"),
	locale: "sv",
	zone: "Europe/Stockholm",
	color: "#006699"
});


export const partners = immutable(Object.fromEntries([
	coimbra,
	iasi,
	jena,
	linz,
	pavia,
	poitiers,
	salamanca,
	turku,
	umea
].map(partner =>
	[partner.id, partner]
)));

export const languages = immutable(unique([
	"en", ...Object.values(partners).map(({ locale }) => locale)
]));

export const licenses = immutable({

	CCBYNCND40: {

		id: "https://creativecommons.org/licenses/by-nc-nd/4.0/",

		label: "CC BY-NC-ND 4.0",
		comment: { en: "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International" }

	}

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const coverage = dedent`
	> [!WARNING]
	> The copyright and licence stated for this dataset cover its catalogue records only. The content those records
	> describe is gathered from external sources and remains subject to the rights of its original publishers: follow
	> the source link of each resource to check those rights before reusing its content. See the
	> [Legal Notice](/about/legal/#content) for details.
`;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type Partner = {

	readonly id: Reference
	readonly locale: Tag
	readonly zone: string // !!! type
	readonly color: string // brand colour, in hex notation

}

export type Entity = State<typeof Entity>
export type Place = State<typeof Place>


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function Entity() {
	return resource({

		space: rdfs,

		name: "RDFS Entity",
		description: "A resource annotated with the RDF Schema properties for labels, comments and related resources."

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

		space: geo,

		name: "Geo Place",
		description: "A geographic location identified by its WGS84 coordinates."

	});
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function getPartner(id: Reference) {

	return assert(partners[id], isDefined, `unknown university <${id}>`);

}

/**
 * Describes a dataset of harvested resources.
 *
 * The description is the summary followed, as a separate paragraph, by a warning scoping the copyright and licence of
 * the dataset to its catalogue records, so that the rights statement travels with the dataset and is never read as
 * covering the content it catalogues.
 *
 * @param summary The one-paragraph description of the dataset
 *
 * @returns `summary` followed by the warning on the scope of the copyright and licence of the dataset
 */
export function harvested(summary: string): string {
	return `${summary}\n\n${coverage}`;
}
