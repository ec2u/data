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

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.ai.openai.models.EmbeddingsOptions;
import com.azure.core.credential.KeyCredential;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Supplier;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.util.Loggers.time;

import static java.lang.String.format;
import static java.util.function.Predicate.not;

public class OpenEmbedder implements Function<String, Optional<Embedding>> {

    /**
     * Retrieves the default text embedder factory.
     *
     * @return the default text embedder factory, which throws an exception reporting the service as undefined
     */
    public static Supplier<OpenEmbedder> embedder() {
        return () -> { throw new IllegalStateException("undefined text embedder service"); };
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final String model;
    private final OpenAIClient client;

    private final Logger logger=service(logger());


    public OpenEmbedder(final String model, final String key) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        if ( model.isBlank() ) {
            throw new IllegalArgumentException("empty model");
        }

        if ( key == null ) {
            throw new NullPointerException("null key");
        }

        this.model=model;
        this.client=new OpenAIClientBuilder()
                .credential(new KeyCredential(key))
                .buildClient();
    }


    @Override
    public Optional<Embedding> apply(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                return Optional.of(text)
                        .filter(not(String::isBlank))
                        .map(s -> client.getEmbeddings(model, new EmbeddingsOptions(List.of(s))))
                        .map(embeddings -> new Embedding(embeddings.getData().getFirst().getEmbedding()));

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<Embedding>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, format(
                "embedded <%,d> chars in <%,d> ms", text.length(), elapsed
        )));

    }

}