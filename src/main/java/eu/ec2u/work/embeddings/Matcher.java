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

import com.metreeca.mesh.util.Collections;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.taxonomies.TaxonomyFrame;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.data.taxonomies.TopicsFrame;

import java.net.URI;
import java.util.Collection;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.entry;
import static com.metreeca.mesh.util.Collections.stash;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.taxonomies.OrganizationTypes.ORGANIZATIONS;
import static java.lang.Math.sqrt;
import static java.lang.String.format;

public final class Matcher {

    public static final URI taxonomy=ORGANIZATIONS;

    public static void main(final String... args) {
        exec(() -> {

            final Set<Topic> topics=service(store())

                    .retrieve(new TopicsFrame(true)

                            .members(stash(query()

                                    .model(new TopicFrame()
                                            .id(uri())
                                            .embedding("")
                                    )

                                    .where("inScheme", criterion()
                                            .any(new TaxonomyFrame(true).id(taxonomy))
                                    )
                            ))

                    )

                    .map(TopicsFrame::new)
                    .map(TopicsFrame::members)
                    .orElseGet(Collections::set);

            new Matcher()
                    .match("biblio", topics)
                    .map(Reference::id)
                    .forEach(uri -> System.out.println(uri));

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final double threshold=0.25;

    private final Function<String, Optional<List<Float>>> embedder
            =new Embedder(service(vault()).get("openai-key"), "text-embedding-3-small");


    private <V extends Resource> Stream<V> match(final String query, final Collection<V> topics) {
        return embedder.apply(query).stream().flatMap(q -> topics.stream()
                .filter(topic -> topic.embedding() != null)
                .map(topic -> entry(topic, cosine(q, Embedder.decode(topic.embedding()))))
                .sorted(Entry.<V, Double>comparingByValue().reversed())
                .filter(e -> e.getValue() >= threshold)
                .peek(e -> service(logger()).info(this, format(
                        "(%.3f) matched <%s> to <%s>", e.getValue(), query, e.getKey().id()
                )))
                .map(Entry::getKey)
        );
    }


    private static double cosine(final List<Float> x, final List<Float> y) {

        if ( x.isEmpty() || y.isEmpty() ) {
            throw new IllegalArgumentException("empty embeddings");
        }

        if ( x.size() != y.size() ) {
            throw new IllegalArgumentException(format(
                    "mismatched embedding lengths <%d>/<%d>", x.size(), y.size()
            ));
        }

        double dot=0.0, xnorm=0.0, ynorm=0.0;

        for (int i=0, n=x.size(); i < n; ++i) {

            final double xi=x.get(i);
            final double yi=y.get(i);

            dot+=xi*yi;
            xnorm+=xi*xi;
            ynorm+=yi*yi;
        }

        return dot/(sqrt(xnorm)*sqrt(ynorm));
    }

}