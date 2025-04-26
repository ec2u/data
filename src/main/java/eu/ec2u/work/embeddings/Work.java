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

package eu.ec2u.work.embeddings;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.taxonomies.Topics;
import eu.ec2u.data.units.Units;

import java.net.URI;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.flow.Locator.service;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.taxonomies.OrganizationTypes.ORGANIZATIONS;
import static eu.ec2u.work.embeddings.OpenEmbedder.embedder;

public final class Work {

    public static final URI taxonomy=ORGANIZATIONS;

    public static void main(final String... args) {
        exec(() -> {

            final double threshold=Units.TYPE_THRESHOLD;
            final Function<String, Optional<Embedding>> embedder=service(embedder());

            embedder.apply("biblio").stream()
                    .flatMap(embedding -> Topics.match(taxonomy, embedding, threshold))
                    .map(Reference::id)
                    .forEach(System.out::println);

        });
    }

}