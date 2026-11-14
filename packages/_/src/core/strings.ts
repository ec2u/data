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

import { type Optional } from "@metreeca/core";
import { Markdown } from "@metreeca/core/strings";


/**
 * Matches a markdown text as its summary and details, the two parts trimmed of the blank lines and spaces around them.
 *
 * A front matter block opening the text, fenced by `---` lines, is skipped and belongs to neither part.
 */
const MarkdownPattern = /^(?:---[ \t]*\n(?:[\s\S]*?\n)?---[ \t]*(?:\n|$))?\s*([\s\S]*?)(?:[ \t]*\n[ \t]*\n\s*([\s\S]*?))?\s*$/;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function summary(markdown: Markdown): Optional<Markdown> {

	return markdown.match(MarkdownPattern)?.[1] || undefined;

}

export function details(markdown: Markdown): Optional<Markdown> {

	return markdown.match(MarkdownPattern)?.[2] || undefined;

}
