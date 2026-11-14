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
 * Markdown string operations.
 *
 * **Summarising Markdown Content**
 *
 * Split markdown content into the summary leading it and the details following it, so that a view shows the gist of
 * the content at a glance and keeps the rest, paragraph breaks included, for readers asking for more:
 *
 * ```typescript
 * import { details, summary } from '@metreeca/core/strings';
 *
 * summary("Topics.\n\nDrawn from EuroSciVoc."); // "Topics."
 * details("Topics.\n\nDrawn from EuroSciVoc."); // "Drawn from EuroSciVoc."
 * ```
 *
 * @module
 */

import { opt, type Optional } from "@metreeca/core";
import { clip, Markdown, tidy } from "@metreeca/core/strings";


/**
 * Matches markdown content as its summary and details, the two parts trimmed of the blank lines and spaces around them.
 *
 * A front matter block fenced by `---` lines and opening the content after any blank lines is skipped, owned by neither
 * part; line terminators are expected as `\n`, so content is matched only once its line terminators are normalised.
 */
const MarkdownPattern = /^(?:[ \t]*\n)*(?:---[ \t]*\n(?:[\s\S]*?\n)?---[ \t]*(?:\n|$))?\s*([\s\S]*?)(?:[ \t]*\n[ \t]*\n\s*([\s\S]*?))?\s*$/;

/**
 * Matches the `\r\n` and `\r` line terminators to be normalised to `\n`.
 */
const BreakPattern = /\r\n?/g;

/**
 * Matches a first paragraph eligible as a summary, being led by a letter.
 */
const LeadPattern = /^\p{L}/u;

/**
 * The maximum length in code points of a summary drawn from a multi-line paragraph.
 */
const SummaryLength = 80;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extracts the summary of markdown content.
 *
 * Takes the first paragraph as the gist of the content, for a view to show at a glance:
 *
 * - Line terminators (`\r\n`, `\r`, `\n`) are normalised to `\n`
 * - A leading front matter block fenced by `---` lines is skipped
 * - Lines holding only whitespace count as blank, so they end the first paragraph
 * - A paragraph not led by a letter, such as a heading, a list or a rule, yields no summary
 * - A paragraph spanning several lines is folded to a single line as {@link tidy} does and clipped as {@link clip} does
 *
 * @param markdown The markdown content to summarise
 *
 * @returns The first paragraph of `markdown`, trimmed and, if it spans several lines, folded to a single clipped line;
 *     `undefined` if `markdown` is blank or its first paragraph is not led by a letter
 *
 * @see {@link details} for the companion extraction, returning the content kept for readers asking for more
 */
export function summary(markdown: Markdown): Optional<Markdown> {

	return opt(partition(markdown)?.[1], lead =>
		!LeadPattern.test(lead) ? undefined
			: lead.includes("\n") ? clip(tidy(lead), SummaryLength)
				: lead
	);

}

/**
 * Extracts the details of markdown content.
 *
 * Takes the paragraphs following the first one as the content to keep for readers asking for more than the gist,
 * under the same rules {@link summary} applies to line terminators, front matter and blank lines. The first paragraph
 * is left out whether or not it qualifies as a summary, so the two never share content.
 *
 * @param markdown The markdown content to split
 *
 * @returns The paragraphs following the first one in `markdown`, trimmed, with the line terminators normalised and the
 *     breaks between paragraphs preserved; `undefined` if `markdown` holds no paragraph after the first one
 *
 * @see {@link summary} for the companion extraction, returning the gist of the content
 */
export function details(markdown: Markdown): Optional<Markdown> {

	return partition(markdown)?.[2] || undefined;

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Partitions markdown content into its summary and details, with its line terminators normalised to `\n`.
 */
function partition(markdown: Markdown): Optional<RegExpMatchArray> {

	return markdown.replace(BreakPattern, "\n").match(MarkdownPattern) ?? undefined;

}
