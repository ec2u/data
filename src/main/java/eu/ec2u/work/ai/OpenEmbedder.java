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

import com.metreeca.flow.services.Logger;

import com.openai.client.OpenAIClient;
import com.openai.models.embeddings.EmbeddingCreateParams;

import java.util.Optional;
import java.util.function.UnaryOperator;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.util.Loggers.time;

import static eu.ec2u.work.ai.OpenAI.openai;
import static java.lang.String.format;
import static java.util.Objects.requireNonNull;
import static java.util.function.Predicate.not;

public class OpenEmbedder implements Embedder {

    private final String model;
    private final UnaryOperator<EmbeddingCreateParams.Builder> setup;

    private final OpenAIClient client=service(openai());
    private final Logger logger=service(logger());


    public OpenEmbedder(final String model) {
        this(model, options -> options);
    }

    public OpenEmbedder(final String model, final UnaryOperator<EmbeddingCreateParams.Builder> setup) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        if ( model.isBlank() ) {
            throw new IllegalArgumentException("empty model");
        }

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        this.model=model;
        this.setup=setup;
    }


    private EmbeddingCreateParams.Builder params() {
        return requireNonNull(
                setup.apply(EmbeddingCreateParams.builder().model(model)), // let setup override the default model
                "null setup return value"
        );
    }


    @Override
    public Optional<Vector> embed(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                return Optional.of(text)
                        .filter(not(String::isBlank))
                        .map(t -> client.embeddings()
                                .create(params()
                                        .input(t)
                                        .build()
                                )
                                .data()
                                .getFirst()
                                .embedding()
                        )
                        .map(Vector::new);

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<Vector>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, format(
                "embedded <%,d> chars in <%,d> ms", text.length(), elapsed
        )));

    }

}