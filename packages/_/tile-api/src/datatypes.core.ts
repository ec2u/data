/*
 * Copyright © 2026 Metreeca srl
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

import type { Optional } from "@metreeca/core";


/**
 * A datatype property values may take.
 */
export type Datatype = {

	/**
	 * The kind of value the datatype admits: plain text, identifiers such as addresses, tags and IRIs, and temporal
	 * values are told apart among strings.
	 */
	readonly group: "boolean" | "number" | "string" | "identifier" | "temporal" | "dictionary"

	/**
	 * The name the datatype is referred to by in model pages, as `date`.
	 */
	readonly name: string

	/**
	 * A one-line description of the values of the datatype.
	 */
	readonly description: string

	/**
	 * The IRI of the RDF datatype values are stored as.
	 */
	readonly rdf: string

	/**
	 * The location of the specification defining the RDF datatype.
	 */
	readonly spec: string

	/**
	 * The forms values take in JSON payloads, as types or examples.
	 */
	readonly json: readonly string[]

	/**
	 * A caveat on the use of the datatype; none if unrestricted.
	 */
	readonly warning?: string

};


/**
 * The standards datatype descriptions refer to, as Markdown links.
 */
const iso8601 = "[ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)";
const markdown = "[Markdown](https://commonmark.org/)";
const e164 = "[ITU-T E.164](https://www.itu.int/rec/T-REC-E.164)";
const bcp47 = "[BCP 47](https://www.rfc-editor.org/info/bcp47)";

/**
 * The caveat on temporal datatypes other than date-times.
 */
const temporal = "Due to the limitations of SPARQL 1.1 calendrical functions, `instant` (`xsd:dateTime`) is the "
	+"preferred temporal datatype.";

/**
 * The datatypes property values may take, in documentation order, each group listed in one run.
 */
export const datatypes: readonly Datatype[] = [

	datatype("boolean", "boolean", "`true` / `false` flag", "boolean", "`boolean`"),

	datatype("number", "byte", "8-bit signed integer number", "byte", "integral `number`"),
	datatype("number", "short", "16-bit signed integer number", "short", "integral `number`"),
	datatype("number", "int", "32-bit signed integer number", "int", "integral `number`"),
	datatype("number", "long", "64-bit signed integer number", "long", "integral `number`"),
	datatype("number", "float", "Single precision floating point number", "float", "`number`"),
	datatype("number", "double", "Double precision floating point number", "double", "`number`"),
	datatype("number", "integer", "Arbitrary precision integer number, as `123`", "integer", "integral `number`"),
	datatype("number", "decimal", "Arbitrary precision decimal number, as `123.456`", "decimal", "decimal `number`"),

	datatype("string", "string", "Textual content", "string", "`string`"),
	datatype("string", "text", "Single-line plain text", "string", "`string`"),
	datatype("string", "markdown", `${markdown} text`, "string", "`string`"),
	datatype("identifier", "email", "Email address", "string", "`\"user@example.net\"`"),
	datatype("identifier", "phone", `${e164} telephone number`, "string", "`\"+390123456789\"`"),
	datatype("identifier", "tag", `${bcp47} language tag`, "string", "`\"en-GB\"`"),
	datatype("identifier", "iri", "Absolute, root-relative or relative IRI", "string",
		"`\"urn:example:item\"`", "`\"/path\"`", "`\"path\"`"
	),
	datatype("identifier", "url", "Hierarchical URL with scheme and authority", "string", "`\"https://example.net/\"`"),
	{
		...datatype("temporal", "year", `${iso8601} year, with optional timezone offset`, "gYear", "`\"yyyy\"`"),
		warning: temporal
	},
	{
		...datatype("temporal", "date", `${iso8601} date, with optional timezone offset`, "date", "`\"yyyy-MM-dd\"`"),
		warning: temporal
	},
	{
		...datatype("temporal", "time", `${iso8601} time of day, with optional timezone offset`, "time", "`\"hh:mm:ss\"`"),
		warning: temporal
	},
	datatype("temporal", "instant", `${iso8601} date-time, with optional timezone offset`, "dateTime",
		"`\"yyyy-MM-ddThh:mm:ss\"`"
	),
	datatype("temporal", "timestamp", `UTC ${iso8601} date-time with millisecond precision`, "dateTime",
		"`\"yyyy-MM-ddThh:mm:ss.sssZ\"`"
	),
	{
		...datatype("temporal", "duration", `${iso8601} duration`, "duration", "`\"PnYnMnDTnHnMnS\"`"),
		warning: temporal
	},

	{
		group: "dictionary",
		name: "dictionary",
		description: "Localised human-readable textual content",
		rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString",
		spec: "https://www.w3.org/TR/rdf-schema/#ch_langstring",
		json: ["`{ \"locale\": \"text\" }`", "`{ \"locale\": [\"text\", …] }`"]
	}

];


/**
 * Looks up a datatype by the name a model page refers to it by.
 *
 * Names are matched regardless of case, so that `Dictionary`, as localised text is typed in model pages, finds the
 * `dictionary` datatype.
 *
 * @param name The name of the datatype
 *
 * @returns The datatype named `name`; none if no datatype is named so
 */
export function getDatatype(name: string): Optional<Datatype> {
	return datatypes.find(datatype => datatype.name === name.toLowerCase());
}


/**
 * Names the anchor of a datatype among the datatypes listed on the models index page.
 *
 * @param name The name of the datatype
 *
 * @returns The fragment identifier of the datatype named `name`, as `datatype-date`
 */
export function getDatatypeAnchor(name: string): string {
	return `datatype-${name.toLowerCase()}`;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Describes a datatype stored as an XML Schema datatype.
 */
function datatype(
	group: Datatype["group"], name: string, description: string, xsd: string, ...json: readonly string[]
): Datatype {
	return {
		group, name, description, json,
		rdf: `http://www.w3.org/2001/XMLSchema#${xsd}`,
		spec: `https://www.w3.org/TR/xmlschema-2/#${xsd}`
	};
}
