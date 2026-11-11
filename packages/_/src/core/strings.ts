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
 * Markdown text utilities.
 *
 * Splits a markdown description into the summary leading it and the details following it, so a view can show the
 * gist of a description at a glance and keep the rest for readers asking for more.
 *
 * @module
 */

import { Markdown } from "@metreeca/core/strings";


/**
 * Matches a markdown text as its summary and details, the two parts trimmed of the blank lines and spaces around them.
 */
const MarkdownPattern = /^\s*([\s\S]*?)(?:[ \t]*\n[ \t]*\n\s*([\s\S]*?))?\s*$/;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// @ts-ignore
/**
 * Summarises a markdown text.
 *
 * Following the TSDoc convention, the summary is the first paragraph of the text, ending at the first blank line.
 *
 * @param markdown The markdown text to be summarised
 *
 * @returns The first paragraph of `markdown`, trimmed; an empty string if `markdown` is blank
 */
export function summary(markdown: Markdown): Markdown {

	return markdown.match(MarkdownPattern)?.[1] ?? "";

}

/**
 * Details a markdown text.
 *
 * The details are what follows the {@link summary} of the text, from its second paragraph on, with the blank lines
 * separating the paragraphs kept as they are.
 *
 * @param markdown The markdown text to be detailed
 *
 * @returns The paragraphs of `markdown` following the first one, trimmed; an empty string if it states only one
 */
export function details(markdown: Markdown): Markdown {

	return markdown.match(MarkdownPattern)?.[2] ?? "";

}
