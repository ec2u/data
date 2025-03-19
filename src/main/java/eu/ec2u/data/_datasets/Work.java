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

package eu.ec2u.data._datasets;

import com.metreeca.flow.services.Translator;

import java.util.Locale;
import java.util.Map;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Translator.translator;

public final class Work {

    // public static void main(final String... args) {
    //     exec(() -> service(store()).update(array(Xtream
    //
    //             .of(bean(Dataset.class)
    //
    //                     // !!! void:rootResource void:Dataset ;
    //
    //                     .setId(URI.create("/"))
    //
    //                     .setTitle(localize(Map.of(
    //                             Locale.ENGLISH, "EC2U Dataset Catalog"
    //                     )))
    //
    //                     .setAlternative(localize(Map.of(
    //                             Locale.ENGLISH, "EC2U Datasets"
    //                     )))
    //
    //                     .setDescription(localize(Map.of(
    //                             Locale.ENGLISH, "Datasets published on the EC2U Knowledge Hub."
    //                     )))
    //
    //                     .setRights("Copyright © 2022-2024 EC2U Alliance")
    //
    //                     .setIsDefinedBy(URI.create("/datasets/"))
    //
    //                     .setLicenses(Set.of(
    //                             License.CCBYNCND40()
    //                     ))
    //
    //             )
    //
    //             .map(Beans::value)
    //             .optMap(new Validate().deep(true))
    //             .toList()
    //     )));
    // }


    private static Map<Locale, String> localize(final Map<Locale, String> value) {

        final Translator translator=service(translator());

        return value; // !!!
    }

}
