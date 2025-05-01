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

package eu.ec2u.data.resources;

import com.metreeca.mesh.tools.Store;

import eu.ec2u.work.ai.Embedder;
import eu.ec2u.work.ai.Embedder.CacheEmbedder;
import eu.ec2u.work.ai.StoreEmbedder;
import eu.ec2u.work.ai.Vector;
import eu.ec2u.work.ai.VectorIndex;

import java.net.URI;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.stash;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.EC2U.EMBEDDINGS;
import static eu.ec2u.data.resources.Resources.RESOURCES;
import static eu.ec2u.work.ai.Embedder.embedder;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toMap;

final class ResourcesMatcher {

    private static final int CACHING_SIZE_LIMIT=100;


    private static final Map<URI, VectorIndex<URI>> INDICES=new ConcurrentHashMap<>();

    private static final ThreadLocal<Embedder> EMMBEDER=ThreadLocal.withInitial(() -> new CacheEmbedder(
                    new StoreEmbedder(service(embedder()))
                            .partition(EMBEDDINGS)
                            .limit(CACHING_SIZE_LIMIT)
            )
    );


    static Stream<URI> match(final URI collection, final String query, final double threshold) {

        final Store store=service(store());
        final Embedder embedder=EMMBEDER.get();

        final VectorIndex<URI> index=INDICES.computeIfAbsent(collection, t -> new VectorIndex<URI>(store

                .retrieve(new ResourcesFrame(true).id(RESOURCES.id()).members(stash(query()

                        .model(new ResourceFrame()
                                .id(uri())
                                .embedding("")
                        )

                        .where("collection", criterion()
                                .any(new CollectionFrame(true).id(t))
                        )

                )))

                .map(ResourcesFrame::new)
                .map(ResourcesFrame::members)
                .stream()
                .flatMap(Collection::stream)
                .filter(resource -> resource.embedding() != null)
                .collect(toMap(Reference::id, resource -> Vector.decode(resource.embedding())))
        ));

        return Optional.of(query)
                .filter(not(String::isBlank))
                .flatMap(embedder::embed)
                .stream()
                .flatMap(embedding -> index.lookup(embedding, threshold));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private ResourcesMatcher() { }

}
