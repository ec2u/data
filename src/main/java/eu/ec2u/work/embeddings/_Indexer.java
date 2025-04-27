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

import com.metreeca.mesh.tools.Store;
import com.metreeca.mesh.util.Collections;

import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.resources.ResourceFrame;
import eu.ec2u.data.taxonomies.TaxonomyFrame;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.data.taxonomies.TopicsFrame;

import java.net.URI;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Locales.ANY;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.taxonomies.EuroSciVoc.EUROSCIVOC;
import static eu.ec2u.work.embeddings.Embedder.embedder;

public final class _Indexer {

    public static final URI taxonomy=EUROSCIVOC;


    public static void main(final String... args) {
        exec(() -> new _Indexer().index(service(store())

                .retrieve(new TopicsFrame(true)

                        .members(stash(query()

                                .model(new TopicFrame()
                                        .id(uri())
                                        .prefLabel(map(entry(ANY, "")))
                                        .altLabel(map(entry(ANY, set(""))))
                                        .hiddenLabel(map(entry(ANY, set(""))))
                                        .definition(map(entry(ANY, "")))
                                        .embedding("")
                                )

                                .where("inScheme", criterion()
                                        .any(new TaxonomyFrame(true).id(taxonomy))
                                )

                        ))

                )

                .map(TopicsFrame::new)
                .map(TopicsFrame::members)
                .orElseGet(Collections::set)

        ));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Embedder embedder=service(embedder());


    public void index(final Collection<? extends Resource> resources) {

        if ( resources == null || resources.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null resources");
        }

        final List<ResourceFrame> mutations=resources.stream()

                .filter(topic -> topic.embedding() == null) // !!! option to force reindexing

                .map(topic -> Optional

                        .of(Vector.embeddable(topic.embeddable()))

                        .flatMap(embedder)

                        .map(e -> new ResourceFrame(true)
                                .id(topic.id())
                                .embedding(Vector.encode(e))
                        )

                )
                .flatMap(Optional::stream)
                .toList();

        store.mutate(array(mutations), FORCE);

    }

}
