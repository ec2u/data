/*
 * Copyright © 2025 Metreeca srl
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
 * @module Template literal tags for content type identification and formatting.
 */

import dedent from "dedent";

/**
 * Template literal tag that marks a string as markdown content.
 *
 * <p>Identifies template literals containing markdown syntax, enabling proper handling
 * by markdown processors and development tools. The tag also normalizes indentation
 * to ensure clean rendering regardless of the surrounding code structure.</p>
 *
 * @param template the template strings array containing markdown content
 * @param values interpolated values to be embedded in the markdown
 *
 * @returns the markdown string with normalized indentation
 */
export function md(template: TemplateStringsArray, ...values: unknown[]): string {
	return dedent(template, ...values);
}

/**
 * Template literal tag that marks a string as SPARQL query content.
 *
 * <p>Identifies template literals containing SPARQL query syntax, enabling proper handling
 * by SPARQL processors and development tools. The tag also normalizes indentation
 * to ensure clean formatting regardless of the surrounding code structure.</p>
 *
 * @param template the template strings array containing SPARQL query content
 * @param values interpolated values to be embedded in the query
 *
 * @returns the SPARQL query string with normalized indentation
 */
export function sparql(template: TemplateStringsArray, ...values: unknown[]): string {
	return dedent(template, ...values);
}
