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

package eu.ec2u.work.ai.gemini;

import com.metreeca.flow.services.Logger;

import com.google.genai.types.EmbedContentConfig;
import eu.ec2u.work.ai.Embedder;
import eu.ec2u.work.ai.Vector;

import java.util.Optional;
import java.util.function.Consumer;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Loggers.elide;
import static com.metreeca.shim.Loggers.time;

import static eu.ec2u.work.ai.gemini.Gemini.gemini;
import static java.lang.String.format;
import static java.util.function.Predicate.not;

/**
 * Gemini text embedding generator.
 *
 * <p>Generates text embeddings using models provided by the Google Gemini platform.</p>
 *
 * @see Gemini
 */
public class GeminiEmbedder implements Embedder {

    private final String model;
    private final Consumer<EmbedContentConfig.Builder> setup;

    private final Gemini gemini=service(gemini());
    private final Logger logger=service(logger());


    public GeminiEmbedder(final String model) {
        this(model, builder -> { });
    }

    public GeminiEmbedder(final String model, final Consumer<EmbedContentConfig.Builder> setup) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        this.model=model;
        this.setup=setup;
    }


    @Override
    public Optional<Vector> embed(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                final EmbedContentConfig.Builder builder=EmbedContentConfig.builder();

                setup.accept(builder);

                final EmbedContentConfig config=builder.build();

                return Optional.of(text)
                        .filter(not(String::isBlank))
                        .map(t -> gemini.retry(model, 0, () -> gemini
                                .client()
                                .models
                                .embedContent(model, t, config)
                                .embeddings()
                                .orElseThrow(() -> new IllegalStateException("missing embeddings"))
                                .getFirst()
                                .values()
                                .orElseThrow(() -> new IllegalStateException("missing embedding values"))
                        ))
                        .map(Vector::new);

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<Vector>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, format(
                "embedded <%s> (<%,d> chars) in <%,d> ms", elide(text), text.length(), elapsed
        )));

    }

}
