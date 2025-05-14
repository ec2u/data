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
import java.util.function.Consumer;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Loggers.elide;
import static com.metreeca.shim.Loggers.time;

import static eu.ec2u.work.ai.OpenAI.backoff;
import static eu.ec2u.work.ai.OpenAI.openai;
import static java.lang.String.format;
import static java.util.function.Predicate.not;

/**
 * OpenAI text embedding generator.
 *
 * <p>Generates ext embedding using models provided by the OpenAI platform.</p>
 *
 * @see OpenAI
 */
public class OpenEmbedder implements Embedder {

    private final Consumer<EmbeddingCreateParams.Builder> setup;

    private final OpenAIClient client=service(openai());
    private final Logger logger=service(logger());


    public OpenEmbedder(final String model) {
        this(builder -> builder.model(model));
    }

    public OpenEmbedder(final Consumer<EmbeddingCreateParams.Builder> setup) {

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        this.setup=setup;
    }


    @Override
    public Optional<Vector> embed(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                final EmbeddingCreateParams.Builder builder=new EmbeddingCreateParams.Builder();

                setup.accept(builder);

                return backoff(0, () -> Optional.of(text)
                        .filter(not(String::isBlank))
                        .map(t -> client.embeddings()
                                .create(builder
                                        .input(t)
                                        .build()
                                )
                                .data()
                                .getFirst()
                                .embedding()
                        )
                        .map(Vector::new)
                );

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<Vector>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, format(
                "embedded <%s> (<%,d> chars) in <%,d> ms", elide(text), text.length(), elapsed
        )));

    }

}