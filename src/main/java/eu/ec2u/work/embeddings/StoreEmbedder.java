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

import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.shapes.Shape;
import com.metreeca.mesh.tools.Store;

import java.net.URI;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.String;
import static com.metreeca.mesh.Value.field;
import static com.metreeca.mesh.Value.id;
import static com.metreeca.mesh.Value.object;
import static com.metreeca.mesh.Value.shape;
import static com.metreeca.mesh.Value.string;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.shapes.Property.property;
import static com.metreeca.mesh.shapes.Shape.shape;
import static com.metreeca.mesh.shapes.Type.type;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.URIs.item;
import static com.metreeca.mesh.util.URIs.uuid;

import static java.lang.String.format;

public final class StoreEmbedder implements Embedder {

    private static final String EMBEDDING="Embedding";

    private static final String STRING="string";
    private static final String VALUES="values";

    private static final Shape EMBEDDING_SHAPE=shape()
            .clazz(type(EMBEDDING))
            .property(property(STRING).forward(true).shape(shape().datatype(String()).required()))
            .property(property(VALUES).forward(true).shape(shape().datatype(String()).required()));


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Embedder embedder;

    private URI partition=item("~embeddings");

    private final Store store=service(store());
    private final Logger logger=service(logger());


    public StoreEmbedder(final Embedder embedder) {

        if ( embedder == null ) {
            throw new NullPointerException("null embedder");
        }

        this.embedder=embedder;
    }


    public StoreEmbedder partition(final URI partition) {

        if ( partition == null ) {
            throw new NullPointerException("null partition");
        }

        this.partition=partition;

        return this;
    }


    @Override
    public Optional<Vector> apply(final String text) {
        return store

                .retrieve(value(query()
                        .model(object(
                                shape(EMBEDDING_SHAPE),
                                field(VALUES, String())
                        ))
                        .where(STRING, criterion().any(string(text)))
                ))

                .flatMap(value -> value.select("*.values").strings().findFirst())
                .map(Vector::decode)

                .map(embedding -> {

                    logger.info(this, format("retrieved embedding for <%s>", text));

                    return embedding;

                })

                .or(() -> embedder.apply(text).map(embedding -> {

                    store.partition(partition).update(object(
                            shape(EMBEDDING_SHAPE),
                            id(item(uuid(text))),
                            field(STRING, string(text)),
                            field(VALUES, string(Vector.encode(embedding)))
                    ), FORCE);

                    return embedding;

                }));
    }

}
