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
 * Plain text processing.
 *
 * Provides the {@link dedent} template literal tag for embedding indented multi-line text in source code, alongside
 * {@link clip}, {@link fold} and {@link normalize} for fitting text to the length and layout constraints of a target
 * medium, for instance a log entry, a prompt or a single-line record field.
 *
 * @module
 */

/**
 * Template literal tag stripping the indentation from a multi-line string.
 *
 * Reports the content of a template literal without the leading indentation shared by its lines, so that text embedded
 * in source code is laid out with the surrounding block without carrying its indentation into the reported value.
 *
 * @see {@link https://github.com/dmnd/dedent dedent}
 */

export { default as dedent } from "dedent";


/**
 * Plain text.
 *
 * Human-readable text with no embedded markup.
 *
 * > [!NOTE]
 * > For documentation purposes only: values are plain strings, with no validation or type-level enforcement.
 */
export type Text = string;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Truncates text to a maximum length.
 *
 * Reports `text` unchanged if it already fits, cutting it to `length` characters otherwise, with the last one replaced
 * by an ellipsis marking the elision; text is cut at an arbitrary position, with no attempt to break at a word
 * boundary.
 *
 * @param text The text to be truncated
 * @param length The maximum length of the reported text
 *
 * @returns `text`, if no longer than `length`, or its leading `length` characters, with the last one replaced by an
 * ellipsis
 */
export function clip(text: string, length: number): string {
	return text.length <= length ? text : text.substring(0, length-1)+"…";
}

/**
 * Collapses consecutive line breaks in text.
 *
 * > [!WARNING]
 * > Not implemented yet: `text` is currently reported unchanged.
 *
 * @param text The text whose line breaks are to be collapsed
 * @param newlines The maximum number of consecutive line breaks to be retained
 *
 * @returns `text`, with runs of more than `newlines` consecutive line breaks collapsed
 */
export function fold(text: string, newlines: number): string {
	return text; // !!!
}

/**
 * Normalises whitespace in text.
 *
 * Replaces every run of whitespace, line breaks included, with a single space, reducing `text` to a single line, for
 * instance before embedding it in a log entry or in a field expected to hold one line; leading and trailing whitespace
 * is collapsed to a single space rather than removed.
 *
 * @param text The text to be normalised
 *
 * @returns `text`, with every whitespace run replaced by a single space
 */
export function normalize(text: string): string {
	return text.replaceAll(/\s+/g, " ");
}
