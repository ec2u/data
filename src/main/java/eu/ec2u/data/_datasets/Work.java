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

import com.metreeca.flow.jsonld.actions.Validate;
import com.metreeca.flow.services.Translator;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Store;
import com.metreeca.mesh.Text;
import com.metreeca.mesh.bean.Beans;

import eu.ec2u.data._assets.License;

import java.util.Set;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.jsonld.formats.JSONLD.store;
import static com.metreeca.flow.services.Translator.translator;
import static com.metreeca.mesh.Text.text;
import static com.metreeca.mesh.Values.set;
import static com.metreeca.mesh.Values.uri;
import static com.metreeca.mesh.bean.Beans.bean;

import static eu.ec2u.data.Data.exec;
import static java.util.stream.Collectors.toList;

public final class Work {

    public static void main(final String... args) {
        exec(() -> {

            final Store store=service(store());

            store.insert(Xtream.of(catalog())
                    .map(catalog -> catalog
                            .setTitle(localize(catalog.getTitle()))
                            .setAlternative(localize(catalog.getAlternative()))
                            .setDescription(localize(catalog.getDescription()))
                    )
                    .map(Beans::frame)
                    .optMap(new Validate().deep(true))
                    .collect(toList())
            );

        });
    }


    private static Set<Text> localize(final Set<Text> value) {

        final Translator translator=service(translator());

        return value; // !!!
    }


    private static Dataset catalog() {

        // !!! void:rootResource void:Dataset ;

        return bean(Dataset.class)

                .setId(uri("/"))

                .setTitle(set(
                        text("EC2U Dataset Catalog", "en")
                ))

                .setAlternative(set(
                        text("EC2U Datasets", "en")
                ))

                .setDescription(set(
                        text("Datasets published on the EC2U Knowledge Hub.", "en")
                ))

                .setRights("Copyright © 2022-2024 EC2U Alliance")

                .setIsDefinedBy(uri("/datasets/"))

                .setLicenses(set(
                        License.CCBYNCND40()
                ));
    }

}
