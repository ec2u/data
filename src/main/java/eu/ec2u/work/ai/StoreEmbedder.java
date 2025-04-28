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

package eu.ec2u.work.ai;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.shapes.Shape;
import com.metreeca.mesh.tools.Store;

import java.net.URI;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.String;
import static com.metreeca.mesh.Value.array;
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
import static com.metreeca.mesh.util.Collections.list;
import static com.metreeca.mesh.util.Loggers.time;
import static com.metreeca.mesh.util.URIs.item;
import static com.metreeca.mesh.util.URIs.uuid;

import static java.lang.String.format;
import static java.util.function.Predicate.not;

public final class StoreEmbedder implements Embedder {

    private static final String PARTITION="~embeddings";


    private static final String EMBEDDING="Embedding";

    private static final String STRING="string";
    private static final String VECTOR="vector";

    private static final Shape EMBEDDING_SHAPE=shape()
            .clazz(type(EMBEDDING))
            .property(property(STRING).forward(true).shape(shape().datatype(String()).required()))
            .property(property(VECTOR).forward(true).shape(shape().datatype(String()).required()));


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Embedder embedder;

    private URI partition=item(PARTITION);

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

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return Optional.of(text)
                .filter(not(String::isBlank))
                .flatMap(t -> time(() -> store

                        .retrieve(value(query()
                                .model(object(
                                        shape(EMBEDDING_SHAPE),
                                        field(VECTOR, String())
                                ))
                                .where(STRING, criterion().any(string(t)))
                        ))

                        .flatMap(value -> value.select("*.vector").strings().findFirst())
                        .map(Vector::decode)

                ).apply((elapsed, vector) -> vector.ifPresent(v -> logger.info(this, format(

                        "retrieved embedding for <%,d> chars in <%,d> ms", t.length(), elapsed

                )))).or(() -> embedder.apply(t).map(embedding -> {

                    store.partition(partition).update(array(list(Stream
                            .of(object(
                                    shape(EMBEDDING_SHAPE),
                                    id(item(uuid(t))),
                                    field(STRING, string(t)),
                                    field(VECTOR, string(Vector.encode(embedding)))
                            ))
                            .map(new Validate<>())
                            .flatMap(Optional::stream)
                    )), FORCE);


                    return embedding;

                })));
    }

}
