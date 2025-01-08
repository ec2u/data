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

package eu.ec2u.data.concepts;

import com.metreeca.http.toolkits.Strings;

import eu.ec2u.data.resources.Resources;
import jakarta.json.Json;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static java.util.Map.entry;
import static java.util.stream.Collectors.toMap;

public final class Languages {

    private static final Pattern TagPattern=Pattern.compile("[a-z]{2}");


    private static final Map<String, String> NameToCode=Resources.locales().stream()
            .map(Locale::forLanguageTag)
            .flatMap(target -> locales()
                    .map(source -> entry(source, target))
            )
            .collect(toMap(
                    entry -> Strings.lower(entry.getKey().getDisplayLanguage(entry.getValue())),
                    entry -> entry.getKey().getLanguage(),
                    (x, y) -> x // !!! check x == y
            ));

    private static final Map<String, Object> CodeToNames=locales()
            .collect(toMap(
                    Locale::getLanguage,
                    locale -> Resources.locales().stream()
                            .map(Locale::forLanguageTag)
                            .collect(toMap(
                                    Locale::getLanguage,
                                    locale::getDisplayLanguage
                            ))
            ));


    public static Optional<String> languageCode(final String name) {
        return Optional.of(name)
                .map(Strings::normalize)
                .map((Strings::lower))
                .map(NameToCode::get);
    }


    private static Stream<Locale> locales() {
        return Arrays.stream(Locale.getAvailableLocales())
                .filter(locale -> TagPattern.matcher(locale.toLanguageTag()).matches());
    }


    public static void main(final String... args) {
        System.out.println(Json.createObjectBuilder(CodeToNames).build());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Languages() { }

}
