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

import { opt, type Optional } from "@metreeca/core";
import { clip, Markdown } from "@metreeca/core/strings";


/**
 * Matches a markdown text as its summary and details, the two parts trimmed of the blank lines and spaces around them.
 *
 * A front matter block fenced by `---` lines and opening the text after any blank lines is skipped, owned by neither
 * part; line breaks are expected as LF, so texts are {@link split} only once normalised.
 */
const MarkdownPattern = /^(?:[ \t]*\n)*(?:---[ \t]*\n(?:[\s\S]*?\n)?---[ \t]*(?:\n|$))?\s*([\s\S]*?)(?:[ \t]*\n[ \t]*\n\s*([\s\S]*?))?\s*$/;

/**
 * Matches the CRLF and lone CR line breaks to be normalised to LF.
 */
const BreakPattern = /\r\n?/g;

/**
 * Matches a first paragraph eligible as a summary, being led by a letter.
 */
const LeadPattern = /^\p{L}/u;

/**
 * Matches the whitespace runs to be collapsed to a single space in a summary.
 */
const SpacePattern = /\s+/gu;

/**
 * The maximum length in code points of a summary drawn from a multi-line paragraph.
 */
const SummaryLength = 80;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function summary(markdown: Markdown): Optional<Markdown> {

	return opt(split(markdown)?.[1], brief);

}

export function details(markdown: Markdown): Optional<Markdown> {

	return split(markdown)?.[2] || undefined;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Splits a markdown text into its summary and details, with its line breaks normalised to LF.
 */
function split(markdown: Markdown): Optional<RegExpMatchArray> {
	return markdown.replace(BreakPattern, "\n").match(MarkdownPattern) ?? undefined;
}

/**
 * Shapes the first paragraph of a markdown text as its summary.
 */
function brief(paragraph: Markdown): Optional<Markdown> {
	return !LeadPattern.test(paragraph) ? undefined
		: paragraph.includes("\n") ? clip(paragraph.replace(SpacePattern, " "), SummaryLength)
			: paragraph;
}
