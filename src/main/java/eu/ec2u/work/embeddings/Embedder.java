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

import java.util.*;
import java.util.function.Function;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.util.Collections.list;
import static com.metreeca.mesh.util.Loggers.time;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;

public class Embedder implements Function<String, Optional<List<Float>>> {

    public static String embeddable(final Collection<String> strings) {

        if ( strings == null || strings.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null strings");
        }

        return strings.stream()
                .distinct()
                .filter(not(String::isBlank))
                .map("- %s\n"::formatted)
                .collect(joining());
    }


    public static String encode(final List<Float> embedding) {

        if ( embedding == null || embedding.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null embedding or embedding values");
        }

        if ( embedding.stream().anyMatch(not(Float::isFinite)) ) {
            throw new IllegalArgumentException("non finite embedding values");
        }

        return embedding
                .stream()
                .map(Object::toString)
                .collect(joining(","));
    }

    public static List<Float> decode(final String embedding) {

        if ( embedding == null ) {
            throw new NullPointerException("null embedding");
        }

        return list(Arrays.stream(embedding.split(","))
                .map(v -> {

                    try {
                        return Float.parseFloat(v);
                    } catch ( final NumberFormatException e ) {
                        throw new IllegalArgumentException(format("malformed embedding value <%s>", v), e);
                    }

                })
                .peek(v -> {

                    if ( !Float.isFinite(v) ) {
                        throw new IllegalArgumentException(format("non finite embedding value <%s>", v));
                    }

                })
        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final String model;
    private final OpenAIClient client;

    private final Logger logger=service(logger());


    public Embedder(final String key, final String model) {

        if ( key == null ) {
            throw new NullPointerException("null key");
        }

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        if ( model.isBlank() ) {
            throw new IllegalArgumentException("empty model");
        }

        this.model=model;
        this.client=new OpenAIClientBuilder()
                .credential(new KeyCredential(key))
                .buildClient();
    }


    @Override
    public Optional<List<Float>> apply(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                return Optional.of(text)
                        .filter(not(String::isBlank))
                        .map(s -> client.getEmbeddings(model, new EmbeddingsOptions(List.of(s))))
                        .map(embeddings -> list(embeddings.getData().getFirst().getEmbedding()));

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<List<Float>>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, format(
                "embedded <%,d> chars in <%,d> ms", text.length(), elapsed
        )));

    }

}