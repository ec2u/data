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
import com.metreeca.mesh.pipe.Store;
import com.metreeca.mesh.shapes.Shape;

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
import static com.metreeca.shim.Collections.list;
import static com.metreeca.shim.Loggers.elide;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.URIs.base;
import static com.metreeca.shim.URIs.uuid;

import static java.lang.String.format;
import static java.util.function.Predicate.not;

public final class StoreEmbedder implements Embedder {

    private static final String EMBEDDING="Embedding";
    private static final URI EMBEDDINGS=base().resolve("~embeddings/");

    private static final String STRING="string";
    private static final String VECTOR="vector";

    private static final Shape EMBEDDING_SHAPE=shape()
            .clazz(type(EMBEDDING))
            .property(property(STRING).forward(true).shape(shape().datatype(String()).required()))
            .property(property(VECTOR).forward(true).shape(shape().datatype(String()).required()));


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Embedder embedder;

    private int limit; // length limit for cached embeddings (short texts are likely to be repeating labels)

    private final Store store=service(store());
    private final Logger logger=service(logger());


    public StoreEmbedder(final Embedder embedder) {

        if ( embedder == null ) {
            throw new NullPointerException("null embedder");
        }

        this.embedder=embedder;
    }

    public StoreEmbedder limit(final int limit) {

        if ( limit < 0 ) {
            throw new IllegalArgumentException(format("negative limit <%d>", limit));
        }

        this.limit=limit;

        return this;
    }


    @Override
    public Optional<Vector> embed(final String text) {

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

                        .value()
                        .flatMap(value -> value.select("*.vector").strings().findFirst())
                        .map(Vector::decode)

                ).apply((elapsed, vector) -> vector.ifPresent(v -> logger.info(this, format(

                        "retrieved embedding for <%s> (<%,d> chars) in <%,d> ms", elide(t), t.length(), elapsed

                )))).or(() -> embedder.embed(t).map(embedding -> {

                    if ( limit == 0 || text.length() <= limit ) {
                        store.insert(array(list(Stream
                                .of(object(
                                        shape(EMBEDDING_SHAPE),
                                        id(EMBEDDINGS.resolve(uuid(t))),
                                        field(STRING, string(t)),
                                        field(VECTOR, string(Vector.encode(embedding)))
                                ))
                                .map(new Validate<>())
                                .flatMap(Optional::stream)
                        )));
                    }

                    return embedding;

                })));
    }

}
