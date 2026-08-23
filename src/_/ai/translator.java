/*
 * Copyright © 2020-2022 EC2U Alliance
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

package com.metreeca.flow.text.services;

import com.metreeca.shim.Locales;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;
import java.util.stream.Stream;

import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Locales.matches;

import static java.util.Arrays.asList;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

/**
 * Text translator.
 *
 * <p>Performs automated text translation.</p>
 */
@FunctionalInterface
public interface Translator {

    /**
     * Retrieves the default translator factory.
     *
     * @return the default translator factory, which throws an exception reporting the service as undefined
     */
    public static Supplier<Translator> translator() {
        return () -> { throw new IllegalStateException("undefined translator service"); };
    }


    /**
     * Preprocesses a translation request.
     *
     * <p>This method performs common pre-translation checks to determine if translation is required or possible.</p>
     *
     * @param text   the text to be preprocessed for translation
     * @param source the source locale of the text
     * @param target the target locale for the translation
     *
     * @return an optional containing:
     *         <ul>
     *             <li>Optional.of(Optional.of(text)) - when translation is not needed because:
     *                 <ul>
     *                     <li>both source and target are ROOT locale (language-independent content)</li>
     *                     <li>text is blank</li>
     *                     <li>source and target locales match according to RFC 4647 rules</li>
     *                 </ul>
     *             </li>
     *             <li>Optional.of(Optional.empty()) - when translation is not possible because either source
     *                 or target (but not both) is the ROOT locale, indicating undefined language</li>
     *             <li>Optional.empty() - when actual translation should be performed</li>
     *         </ul>
     *
     * @throws NullPointerException if any parameter is {@code null}
     * @see <a href="https://www.rfc-editor.org/info/rfc4647">RFC 4647 - Matching of Language Tags</a>
     */
    static Optional<Optional<String>> preprocess(final String text, final Locale source, final Locale target) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( target == null ) {
            throw new NullPointerException("null target");
        }

        return ROOT.equals(source) && ROOT.equals(target) ? Optional.of(Optional.of(text))
                : ROOT.equals(source) || ROOT.equals(target) ? Optional.of(Optional.empty())
                : text.isBlank() || matches(source, target) ? Optional.of(Optional.of(text))
                : Optional.empty();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Translates a locale-keyed map of texts to multiple target locales.
     *
     * @param texts   a locale-keyed map of texts to be translated
     * @param source  the source locale identifying which entries in the map to translate
     * @param targets the target locales for the translated texts
     *
     * @return a new locale-keyed map containing all entries from the input map plus additional entries for each
     *         successfully translated text; source entries matching the source locale are translated to all target
     *         locales; existing non-empty localizations for target locales are preserved
     *
     * @throws NullPointerException if any parameter is {@code null} or {@code targets} contains {@code null} values
     */
    default Map<Locale, String> texts(
            final Map<Locale, String> texts, final Locale source, final Locale... targets
    ) {

        if ( texts == null ) {
            throw new NullPointerException("null texts");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( targets == null || Arrays.stream(targets).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null targets");
        }

        return texts(texts, source, asList(targets));
    }

    /**
     * Translates a locale-keyed map of texts to multiple target locales.
     *
     * @param texts   a locale-keyed map of texts to be translated
     * @param source  the source locale identifying which entries in the map to translate
     * @param targets a collection of target locales for the translated texts
     *
     * @return a new locale-keyed map containing all entries from the input map plus additional entries for each
     *         successfully translated text; source entries matching the source locale are translated to all target
     *         locales; existing localizations for target locales are preserved
     *
     * @throws NullPointerException if any parameter is {@code null} or {@code targets} contains {@code null} values
     */
    default Map<Locale, String> texts(
            final Map<Locale, String> texts, final Locale source, final Collection<Locale> targets
    ) {

        if ( texts == null ) {
            throw new NullPointerException("null texts");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( targets == null || targets.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null targets");
        }

        return Optional.ofNullable(texts.get(source))

                .map(original -> map(Stream.concat(

                        texts.entrySet().stream(),

                        targets.stream()
                                .filter(target -> texts.entrySet().stream().noneMatch(present ->
                                        matches(present.getKey(), target)
                                ))
                                .flatMap(target -> translate(original, source, target)
                                        .map(translated -> entry(target, translated))
                                        .stream()
                                )

                )))

                .orElse(texts);
    }


    /**
     * Translates a locale-keyed map of text sets to multiple target locales.
     *
     * @param textsets a locale-keyed map of text sets to be translated
     * @param source   the source locale identifying which entries in the map to translate
     * @param targets  the target locales for the translated text sets
     *
     * @return a new locale-keyed map containing all entries from the input map plus additional entries for each
     *         successfully translated text set; source entries matching the source locale are translated to all target
     *         locales; existing  localizations for target locales are preserved
     *
     * @throws NullPointerException if any parameter is {@code null} or {@code targets} contains {@code null} values
     */
    default Map<Locale, Set<String>> textsets(
            final Map<Locale, Set<String>> textsets, final Locale source, final Locale... targets
    ) {

        if ( textsets == null ) {
            throw new NullPointerException("null textsets");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( targets == null || Arrays.stream(targets).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null targets");
        }

        return textsets(textsets, source, asList(targets));
    }

    /**
     * Translates a locale-keyed map of text sets to multiple target locales.
     *
     * @param textsets a locale-keyed map of text sets to be translated
     * @param source   the source locale identifying which entries in the map to translate
     * @param targets  a collection of target locales for the translated text sets
     *
     * @return a new locale-keyed map containing all entries from the input map plus additional entries for each
     *         successfully translated text set; source entries matching the source locale are translated to all target
     *         locales; existing non-empty localizations for target locales are preserved
     *
     * @throws NullPointerException if any parameter is {@code null} or {@code targets} contains {@code null} values
     */
    default Map<Locale, Set<String>> textsets(
            final Map<Locale, Set<String>> textsets, final Locale source, final Collection<Locale> targets
    ) {

        if ( textsets == null ) {
            throw new NullPointerException("null textsets");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( targets == null || targets.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null targets");
        }

        return Optional.ofNullable(textsets.get(source)).filter(not(Set::isEmpty))

                .map(originals -> map(Stream.concat(

                        textsets.entrySet().stream(),

                        targets.stream()
                                .filter(target -> textsets.entrySet().stream().noneMatch(present ->
                                        matches(present.getKey(), target)
                                ))
                                .flatMap(target -> Optional.
                                        of(set(originals.stream().flatMap(original ->
                                                translate(original, source, target).stream()
                                        )))
                                        .filter(not(Collection::isEmpty))
                                        .map(translated -> entry(target, translated))
                                        .stream()
                                )

                )))

                .orElse(textsets);
    }


    /**
     * Translates text to multiple target locales.
     *
     * @param text    the text to be translated
     * @param source  the source locale of the {@code text} to be translated or {@link Locales#ANY} if the source
     *                language is expected to be auto-detected
     * @param targets the target locales for the translated text
     *
     * @return a stream containing the original input {@code text} and the input {@code text} translated from
     *         {@code source} to each of the {@code targets} languages; translations may be omitted if errors occur
     *
     * @throws NullPointerException if any parameter is {@code null} or {@code targets} contains {@code null} values
     */
    default Stream<String> translate(final String text, final Locale source, final Locale... targets) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( targets == null || Arrays.stream(targets).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null targets");
        }

        return translate(text, source, asList(targets));
    }

    /**
     * Translates text to multiple target locales.
     *
     * @param text    the text to be translated
     * @param source  the source locale of the {@code text} to be translated or {@link Locales#ANY} if the source
     *                language is expected to be auto-detected
     * @param targets a collection of target locales for the translated text
     *
     * @return a stream containing the original input {@code text} the input {@code text} translated from {@code source}
     *         to each of the {@code targets} languages; translations may be omitted if errors occur
     *
     * @throws NullPointerException if any parameter is {@code null} or {@code targets} contains {@code null} values
     */
    default Stream<String> translate(final String text, final Locale source, final Collection<Locale> targets) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( targets == null || targets.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null targets");
        }

        return targets.stream()
                .distinct()
                .map(target -> translate(text, source, target))
                .flatMap(Optional::stream);
    }


    /**
     * Translates text.
     *
     * @param text   the text to be translated
     * @param source the source locale of the {@code  text} to be translated or {@link Locales#ANY} if the source
     *               language is expected to be auto-detected
     * @param target the target locale for the translated text
     *
     * @return an optional containing the input {@code text} translated from {@code source} to {@code target} language;
     *         an empty optional, if a translation error occurred, for instance if the underlying translation engine
     *         does not support either the {@code target} or the {@code source} language
     *
     * @throws NullPointerException if any parameter is null
     */
    Optional<String> translate(String text, Locale source, Locale target);


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Combo text translator.
     *
     * <p>Returns the translation generated by the first successful translator in a list of delegates.</p>
     */
    public static final class ComboTranslator implements Translator, AutoCloseable {

        private final List<Translator> translators;


        /**
         * Creates a new combo text translator.
         *
         * @param translators the delegate translators
         *
         * @throws NullPointerException if {@code translators} is null or contains null values
         */
        public ComboTranslator(final Translator... translators) {

            if ( translators == null || Arrays.stream(translators).anyMatch(Objects::isNull) ) {
                throw new NullPointerException("null translators");
            }

            this.translators=list(translators);
        }

        /**
         * Creates a new combo text translator.
         *
         * @param translators the delegate translators
         *
         * @throws NullPointerException if {@code translators} is null or contains null values
         */
        public ComboTranslator(final List<Translator> translators) {

            if ( translators == null || translators.stream().anyMatch(Objects::isNull) ) {
                throw new NullPointerException("null translators");
            }

            this.translators=list(translators);
        }


        @Override public Optional<String> translate(final String text, final Locale source, final Locale target) {

            if ( text == null ) {
                throw new NullPointerException("null text");
            }

            if ( target == null ) {
                throw new NullPointerException("null target");
            }

            if ( source == null ) {
                throw new NullPointerException("null source");
            }

            if ( text.isBlank() ) { return Optional.of(text); } else {

                return translators.stream()
                        .flatMap(translator -> translator.translate(text, source, target).stream())
                        .findFirst()
                        .filter(not(String::isEmpty));

            }
        }

        @Override public void close() throws Exception {

            for (final Translator translator : translators) {
                if ( translator instanceof AutoCloseable ) {
                    ((AutoCloseable)translator).close();

                }
            }

        }

    }

    /**
     * Cache text translator.
     *
     * <p>Returns and caches the translation generated by a delegate.</p>
     */
    public static final class CacheTranslator implements Translator, AutoCloseable {

        private final Translator translator;

        private final Map<Key, String> cache=new ConcurrentHashMap<>();


        private final record Key(String text, String source, String target) { }


        /**
         * Creates a new cache text translator.
         *
         * @param translator the delegate translator
         *
         * @throws NullPointerException if {@code translator} is null
         */
        public CacheTranslator(final Translator translator) {

            if ( translator == null ) {
                throw new NullPointerException("null translator");
            }

            this.translator=translator;
        }


        @Override
        public Optional<String> translate(final String text, final Locale source, final Locale target) {

            if ( text == null ) {
                throw new NullPointerException("null text");
            }

            if ( target == null ) {
                throw new NullPointerException("null target");
            }

            if ( source == null ) {
                throw new NullPointerException("null source");
            }

            if ( text.isBlank() ) { return Optional.of(text); } else {

                return Optional.ofNullable(cache.computeIfAbsent(new Key(
                        text,
                                source.toLanguageTag(),
                        target.toLanguageTag()
                        ), key -> translator
                        .translate(text, source, target)
                                .filter(not(String::isEmpty))
                                .orElse(null)
                ));

            }

        }

        @Override public void close() throws Exception {

            if ( translator instanceof AutoCloseable ) {
                ((AutoCloseable)translator).close();

            }

        }

    }

}
