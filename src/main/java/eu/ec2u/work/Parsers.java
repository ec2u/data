/*
 * Copyright © 2020-2025 EC2U Alliance
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

package eu.ec2u.work;


import java.math.BigDecimal;
import java.math.BigInteger;
import java.net.URI;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.MatchResult;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.flow.rdf.Values.guarded;

import static java.lang.String.format;
import static java.util.Locale.ENGLISH;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toSet;

public final class Parsers {

    private static final Pattern URIPattern=Pattern.compile("^https?://\\S+$");
    private static final Pattern FuzzyURLPattern=Pattern.compile("\\bhttps?:\\S+|\\bwww\\.\\S+");
    private static final Pattern MalformedEscapePattern=Pattern.compile("%(?![0-9a-fA-F]{2})");
    private static final Pattern EmailPattern=Pattern.compile("^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");
    private static final Pattern FuzzyIntegerPattern=Pattern.compile("^\\s*(\\d+)(?![.\\d])");
    private static final Pattern FuzzyDecimalPattern=Pattern.compile("^\\s*(\\d+(?:\\.\\d+)?)");
    private static final Pattern LanguagePattern=Pattern.compile("\\b[A-Za-zÀ-ÖØ-öø-ÿ]+\\b");// https://stackoverflow.com/a/26900132


    private Parsers() { }


    public static Optional<URI> uri(final String text) {
        return Optional.of(text)
                .filter(URIPattern.asMatchPredicate())
                .map(URI::create);
    }

    public static Optional<String> url(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return Optional.of(text)

                .map(FuzzyURLPattern::matcher)
                .filter(Matcher::find)
                .map(Matcher::group)

                .map(url -> url.replace("[", "%5B")) // !!! generalize
                .map(url -> url.replace("]", "%5D"))
                .map(url -> url.startsWith("http") ? url : format("https://%s", url))

                .filter(not(url -> MalformedEscapePattern.matcher(url).find()));
    }

    public static Optional<String> email(final String text) {
        return Optional.of(text)
                .filter(EmailPattern.asMatchPredicate());
    }

    public static Optional<LocalDate> localDate(final String text) {
        return Optional.of(text)
                .map(guarded(LocalDate::parse));
    }

    public static Optional<BigInteger> integer(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return Optional.of(text)

                .map(FuzzyIntegerPattern::matcher)
                .filter(Matcher::find)
                .map(matcher -> matcher.group(1))

                .map(BigInteger::new);
    }

    public static Optional<BigDecimal> decimal(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return Optional.of(text)

                .map(FuzzyDecimalPattern::matcher)
                .filter(Matcher::find)
                .map(matcher -> matcher.group(1))

                .map(BigDecimal::new);
    }


    public static Stream<String> languages(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        final Set<String> languages=LanguagePattern
                .matcher(text)
                .results()
                .map(MatchResult::group)
                .map(s -> s.toUpperCase(Locale.ROOT))
                .collect(toSet());

        return Arrays.stream(Locale.getAvailableLocales())
                .filter(locale
                        -> languages.contains(locale.getLanguage().toUpperCase(Locale.ROOT))
                        || languages.contains(locale.getISO3Language().toUpperCase(Locale.ROOT))
                        || languages.contains(locale.getDisplayLanguage(locale).toUpperCase(Locale.ROOT))
                        || languages.contains(locale.getDisplayLanguage(ENGLISH).toUpperCase(Locale.ROOT))
                )
                .map(Locale::getLanguage)
                .distinct();
    }

}
