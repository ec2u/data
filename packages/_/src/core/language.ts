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

import { lazy, opt, type Optional, safe } from "@metreeca/core";
import type { Tag } from "@metreeca/core/language";
import type { IRI } from "@metreeca/core/resource";
import { immutable } from "@metreeca/core/values";


/**
 * The query parameters stating the language of a page.
 */
const parameters = immutable(["lang", "language", "locale", "lng", "hl"]);

/**
 * The language codes that path segments far more often use for other purposes, as `/id/` for record identifiers and
 * `/my/` for personal areas, rather than for Indonesian and Burmese, and are therefore never read as languages there.
 */
const reserved = immutable(["id", "my"]);


/**
 * The ISO 639-1 tags of the languages Intl can name, leaving out deprecated aliases such as `iw` for `he`.
 */
const tags = lazy((): readonly Tag[] => {

	const letters = [..."abcdefghijklmnopqrstuvwxyz"];
	const english = new Intl.DisplayNames(["en"], { type: "language", fallback: "none" });

	return letters
		.flatMap(first => letters.map(second => `${first}${second}`))
		.filter(tag => Intl.getCanonicalLocales(tag)[0] === tag && english.of(tag) !== undefined);

});

/**
 * The normalised names of the languages in {@link tags}, in every locale Intl can name them in.
 */
const names = lazy(() => tags()
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
export function tagName(name: string): Optional<Tag> {

	const key = normalize(name);
	const matches = names().filter(({ label }) => label === key).map(({ tag }) => tag);

	return matches.every(tag => tag === matches[0]) ? matches[0] : undefined;

}

/**
 * Infers the language of a web page from its address.
 *
 * Tells apart the localised versions of a page published on the same site, as `https://www.uc.pt/en/` and
 * `https://www.uc.pt/pt`, where the host alone gives them the same label. The language is read from the first of:
 *
 * - a `lang`, `language`, `locale`, `lng` or `hl` query parameter, as in `detail.php?lang=en` or `?lang=English`
 * - a path segment naming a language, as in `/en/` or `/courses/EN/course/2301`
 * - a file name naming a language, as in `home_en.htm`, `GEP_eng.pdf` or `Codice Etico – Versione Inglese.pdf`
 *
 * A language counts only when stated by a whole segment, query value or underscore- or space-separated file name word:
 * the host and the words of hyphenated slugs are never read, so that `/universite-de-poitiers` is not taken as German.
 * Path segments count only with two-letter codes other than `id` and `my`, as `/iii/` or `/mal/` and `/id/` or `/my/`
 * name research centres, records and personal areas far more often than Sichuan Yi, Malayalam, Indonesian or Burmese.
 *
 * @param iri The address of the page
 *
 * @returns The ISO 639-1 tag of the language `iri` states, without region, or `undefined` if `iri` states none
 *
 * @example
 *
 * ```typescript
 * tagIRI("https://www.uc.pt/en/");                        // "en"
 * tagIRI("https://studienhandbuch.jku.at/a.php?lang=de"); // "de"
 * tagIRI("http://www.ag.jku.at/home_en.htm");             // "en"
 * tagIRI("https://www.uni-jena.de/");                     // undefined
 * ```
 */
export function tagIRI(iri: IRI): Optional<Tag> {

	const url = safe(() => new URL(iri));

	if ( url === undefined || !/^https?:$/.test(url.protocol) ) {
		return undefined;
	}

	const segments = (safe(() => decodeURIComponent(url.pathname)) ?? url.pathname).split("/");
	const file = segments.at(-1)?.match(/^(.+)\.[a-z0-9]+$/i)?.[1] ?? "";

	return [

		...parameters.map(name => url.searchParams.get(name) ?? ""),

		...segments.filter(segment =>
			/^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(segment)
			&& !reserved.includes(segment.slice(0, 2).toLowerCase())
		),

		...file.split(/[_\s]+/)

	].map(language).find(tag => tag !== undefined);


	function language(value: string): Optional<Tag> {

		const code = safe(() => new Intl.Locale(value.replaceAll("_", "-")).language);

		return code !== undefined && tags().includes(code) ? code
			: value.length > 3 ? tagName(value)
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
