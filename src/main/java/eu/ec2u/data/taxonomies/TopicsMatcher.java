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

package eu.ec2u.data.taxonomies;

import com.metreeca.mesh.tools.Store;

import eu.ec2u.work.ai.Embedder;
import eu.ec2u.work.ai.Vector;
import eu.ec2u.work.ai.VectorIndex;

import java.net.URI;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.stash;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.work.ai.Embedder.embedder;
import static java.util.function.Function.identity;
import static java.util.stream.Collectors.toMap;

final class TopicsMatcher {

    private static final Map<URI, VectorIndex<Topic>> INDICES=new ConcurrentHashMap<>();


    static Stream<Topic> match(final URI taxonomy, final String query, final double threshold) {

        final Store store=service(store());
        final Embedder embedder=service(embedder());

        final VectorIndex<Topic> index=INDICES.computeIfAbsent(taxonomy, t -> new VectorIndex<>(store

                .retrieve(new TopicsFrame(true)

                        .members(stash(query()

                                .model(new TopicFrame()
                                        .id(uri())
                                        .embedding("")
                                )

                                .where("inScheme", criterion()
                                        .any(new TaxonomyFrame(true).id(t))
                                )

                        ))

                )

                .map(TopicsFrame::new)
                .map(TopicsFrame::members)
                .stream()
                .flatMap(Collection::stream)
                .filter(topic1 -> topic1.embedding() != null)
                .collect(toMap(identity(), topic -> Vector.decode(topic.embedding())))
        ));

        return embedder.apply(query).stream()
                .flatMap(embedding -> index.match(embedding, threshold));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private TopicsMatcher() { }

}
