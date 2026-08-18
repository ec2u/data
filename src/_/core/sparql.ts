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

/**
 * SPARQL query processing.
 *
 * Provides the {@link sparql} template literal tag for embedding SPARQL queries in source code.
 *
 * @see {@link https://www.w3.org/TR/sparql11-query/ SPARQL 1.1 Query Language}
 *
 * @module
 */

import { dedent } from "@/_/core/text.js";


/**
 * A SPARQL query.
 *
 * A query written in the SPARQL query language.
 *
 * > [!NOTE]
 * > This alias is for documentation purposes only: values are plain strings, with no validation or type-level
 * > enforcement.
 *
 * @see {@link https://www.w3.org/TR/sparql11-query/ SPARQL 1.1 Query Language}
 */
export type SPARQL = string;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Template literal tag marking a string as SPARQL query content.
 *
 * Identifies template literals holding SPARQL syntax, so that query processors and development tools handle them
 * accordingly, and strips the indentation introduced by the surrounding code, keeping the reported query readable in
 * logs and error reports, whatever the nesting of the block it is written in.
 *
 * > [!WARNING]
 * > Interpolated values are inserted verbatim, with no escaping or quoting: never build a query from untrusted input
 * > without validating it first.
 *
 * @param template The template strings the query is split into
 * @param values The values to be interpolated into the query
 *
 * @returns The SPARQL query of `template`, with `values` interpolated and indentation stripped
 */
export function sparql(template: TemplateStringsArray, ...values: unknown[]): SPARQL {
	return dedent(template, ...values);
}
