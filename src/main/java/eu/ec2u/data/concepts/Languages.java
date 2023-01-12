/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.core.toolkits.Strings;

import java.util.Map;
import java.util.Optional;

import static java.util.Map.entry;

public final class Languages {

    private static final Map<String, String> LanguageCodes=Map.ofEntries(
            entry("italian", "it"),
            entry("italiano", "it"),
            entry("english", "en"),
            entry("inglese", "en")
    );

    public static Optional<String> languageCode(final String name) {
        return Optional.of(name)
                .map(Strings::normalize)
                .map((Strings::lower))
                .map(LanguageCodes::get);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Languages() { }

}
