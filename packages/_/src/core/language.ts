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

import { lazy, opt, type Optional, safe, type URLLike } from "@metreeca/core";
import type { Tag } from "@metreeca/core/language";
import { immutable } from "@metreeca/core/values";


/**
 * The query parameters stating the language of a page.
 */
const parameters = immutable(["lang", "language", "locale", "lng", "hl"]);

/**
 * The ISO 639-2 special-purpose codes, which Intl may name although they identify no language.
 */
const special = immutable(["mis", "mul", "und", "zxx"]);


/**
 * The language names Intl displays in English, telling the codes of known languages apart.
 */
const english = lazy(() => new Intl.DisplayNames(["en"], { type: "language", fallback: "none" }));

/**
 * The ISO 639-1 tags of the languages Intl can name, leaving out deprecated aliases such as `iw` for `he`.
 */
const tags = lazy((): readonly Tag[] => {

	const letters = [..."abcdefghijklmnopqrstuvwxyz"];

	return letters
		.flatMap(first => letters.map(second => `${first}${second}`))
		.filter(tag => Intl.getCanonicalLocales(tag)[0] === tag && english().of(tag) !== undefined);

});

/**
 * The normalised names of the languages in {@link tags}, in every locale Intl holds names of its own for.
 */
const names = lazy(() => Intl.DisplayNames.supportedLocalesOf(tags())
	.map(locale => new Intl.DisplayNames([locale], { type: "language", fallback: "none" }))
	.flatMap(display => tags().flatMap(tag => opt(display.of(tag), label => [{ label: normalize(label), tag }]) ?? []))
);


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
export function identifyTag(name: string): Optional<Tag> {

	const key = normalize(name);
	const matches = names().filter(({ label }) => label === key).map(({ tag }) => tag);

	return matches.every(tag => tag === matches[0]) ? matches[0] : undefined;

}

/**
 * Infers the language of a web page from its address.
 *
 * Tells apart the localised versions of a page published on the same site, as `https://example.org/en/` and
 * `https://example.org/pt`, where the host alone gives them the same label. The language is read from the first of:
 *
 * - a `lang`, `language`, `locale`, `lng` or `hl` query parameter, as in `page.php?lang=en` or `?lang=English`
 * - a path segment naming a language, as in `/en/` or `/courses/EN/course/2301`
 * - a file name naming a language, as in `home_en.htm`, `report_eng.pdf` or `Guida – Versione Inglese.pdf`
 *
 * A language counts only when stated by a whole segment, query value or underscore- or space-separated file name word:
 * the host and the words of hyphenated slugs are never read, so that `/universite-de-paris` is not taken as German.
 * Query values count with any two- or three-letter code, as in `?lang=fil`, while path segments count only with
 * two-letter codes and file name words only with codes that have a two-letter equivalent, as `eng`: `/iii/` or `/mal/`
 * name research centres and `new_report.pdf` a fresh report far more often than Sichuan Yi, Malayalam or Newari.
 * Restrict `languages` to rule out codes such as `/id/` or `/my/`, which name records and personal areas far more often
 * than Indonesian or Burmese.
 *
 * @param url The address of the page
 * @param languages The tags of the languages the page may be in, matched by base language, so that `pt-PT` admits `pt`;
 *   codes and names stating other languages are ignored; if omitted, any language is read
 *
 * @returns The ISO 639-1 tag of the language `url` states, or its ISO 639-2 code if it has no two-letter tag, without
 *   region, or `undefined` if `url` states none
 *
 * @example
 *
 * ```typescript
 * inferTag("https://example.org/en/");                      // "en"
 * inferTag("https://example.org/page.php?lang=de");         // "de"
 * inferTag("https://example.org/home_en.htm");              // "en"
 * inferTag("https://example.org/id/1234");                  // "id"
 * inferTag("https://example.org/id/1234", ["en", "fr"]);    // undefined
 * inferTag("https://www.example.de/");                      // undefined
 * ```
 */
export function inferTag(url: URLLike, languages?: readonly Tag[]): Optional<Tag> {

	const parsed = opt(safe(() => new URL(url)), url => /^https?:$/.test(url.protocol) ? url : undefined);
	const path = parsed?.pathname ?? "";

	const segments = (safe(() => decodeURIComponent(path)) ?? path).split("/");
	const file = segments.at(-1)?.match(/^(.+)\.[a-z0-9]+$/i)?.[1] ?? "";

	const targets = languages?.map(language => safe(() => new Intl.Locale(language).language) ?? language);

	return parsed === undefined ? undefined : [

		...parameters.map(name => language(parsed.searchParams.get(name) ?? "")),

		...segments.filter(segment => /^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(segment)).map(language),

		...file.split(/[_\s]+/).map(language).map(tag => tag?.length === 2 ? tag : undefined)

	].find(tag => {

		return tag !== undefined && (targets === undefined || targets.includes(tag));

	});


	function language(value: string): Optional<Tag> {

		const code = safe(() => new Intl.Locale(value.replaceAll("_", "-")).language);

		return code !== undefined && !special.includes(code) && english().of(code) !== undefined ? code
			: value.length > 3 ? identifyTag(value)
				: undefined;

	}

}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Normalises a language name for lookup, ignoring case and Latin accents.
 */
function normalize(name: string): string {
	return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
