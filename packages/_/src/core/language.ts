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

import { memo, opt, type Optional } from "@metreeca/core";
import type { nameTag, Tag } from "@metreeca/core/language";


const Letters = [..."abcdefghijklmnopqrstuvwxyz"];

/**
 * The ISO 639-1 tags of the languages Intl can name, leaving out deprecated aliases such as `iw` for `he`.
 */
const Tags: readonly Tag[] = Letters
	.flatMap(first => Letters.map(second => `${first}${second}`))
	.filter(tag => Intl.getCanonicalLocales(tag)[0] === tag && opt(display("en").of(tag), name => name !== tag));

/**
 * The language names of every locale Intl can display them in.
 */
const Names: readonly Intl.DisplayNames[] = Tags.map(display);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Resolves a language name to its tag.
 *
 * Reverses {@link nameTag} for sources naming languages in words rather than in tags, whatever language the name is
 * written in: `German`, `tedesco`, `Deutsch` and `allemand` all resolve to `de`. Names are matched ignoring case and
 * accents, and a spelling naming different languages in different locales resolves to nothing rather than to a guess.
 *
 * @param name The name of the language
 *
 * @returns The ISO 639-1 tag of the language `name` names, or `undefined` if no language is known by that name
 */
export const tagName = memo((name: string): Optional<Tag> => {

	const key = normalize(name);
	const tags = Tags.filter(tag => Names.some(names => opt(names.of(tag), label => label !== tag && normalize(label) === key)));

	return tags.length === 1 ? tags[0] : undefined;

});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function display(locale: Tag): Intl.DisplayNames {
	return new Intl.DisplayNames([locale], { type: "language" });
}

/**
 * Normalises a language name for lookup, ignoring case and Latin accents.
 */
function normalize(name: string): string {
	return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
