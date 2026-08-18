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
 * Markdown text processing.
 *
 * @see {@link https://spec.commonmark.org/ CommonMark Specification}
 *
 * @module
 */

import { dedent } from "@/_/core/text.js";


/**
 * Markdown text.
 *
 * Text marked up with CommonMark syntax.
 *
 * > [!NOTE]
 * > This alias is for documentation purposes only: values are plain strings, with no validation or type-level
 * > enforcement.
 *
 * @see {@link https://spec.commonmark.org/ CommonMark Specification}
 */
export type Markdown = string;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Template literal tag marking a string as markdown content.
 *
 * Identifies template literals holding markdown syntax, so that processors and development tools handle them
 * accordingly, and strips the indentation introduced by the surrounding code, keeping the reported content aligned as
 * markdown expects, whatever the nesting of the block it is written in.
 *
 * @param template The template strings the markdown content is split into
 * @param values The values to be interpolated into the markdown content
 *
 * @returns The markdown content of `template`, with `values` interpolated and indentation stripped
 */
export function md(template: TemplateStringsArray, ...values: unknown[]): Markdown {
	return dedent(template, ...values);
}
