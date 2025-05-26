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

import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.Value;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.models.ResponseFormatJsonObject;
import com.openai.models.ResponseFormatJsonSchema;
import com.openai.models.ResponseFormatJsonSchema.JsonSchema;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionCreateParams.ResponseFormat;

import java.util.Optional;
import java.util.function.Consumer;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Loggers.elide;
import static com.metreeca.shim.Loggers.time;

import static eu.ec2u.work.ai.OpenAI.backoff;
import static eu.ec2u.work.ai.OpenAI.openai;
import static java.util.function.Predicate.not;

/**
 * OpenAI textual analyzer.
 *
 * <p>Extracts structured information from texts according to plain language prompts processed by the OpenAI
 * platform.</p>
 *
 * @see OpenAI
 */
public final class OpenAnalyzer implements Analyzer {

    private final Consumer<ChatCompletionCreateParams.Builder> setup;

    private final String prompt;
    private final String schema;

    private ResponseFormat format;

    private final OpenAIClient client=service(openai());
    private final Logger logger=service(logger());


    public OpenAnalyzer(final String model) {
        this(builder -> builder.model(model));
    }

    public OpenAnalyzer(final Consumer<ChatCompletionCreateParams.Builder> setup) {
        this(setup, "", "");
    }


    public OpenAnalyzer(
            final Consumer<ChatCompletionCreateParams.Builder> setup,
            final String prompt,
            final String schema
    ) {

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        if ( prompt == null ) {
            throw new NullPointerException("null prompt");
        }

        if ( schema == null ) {
            throw new NullPointerException("null schema");
        }

        this.setup=setup;
        this.prompt=prompt;
        this.schema=schema;
    }


    @Override
    public Analyzer prompt(final String prompt, final String schema) {

        if ( prompt == null ) {
            throw new NullPointerException("null prompt");
        }

        if ( schema == null ) {
            throw new NullPointerException("null schema");
        }

        return new OpenAnalyzer(
                setup,
                prompt,
                schema
        );
    }


    private ResponseFormat format() {
        return format != null ? format : (format=Optional.of(schema)
                .filter(not(String::isBlank))
                .map(s -> {
                    try {

                        return ResponseFormat.ofJsonSchema(ResponseFormatJsonSchema.builder()
                                .jsonSchema(new ObjectMapper().readValue(schema, JsonSchema.class))
                                .build()
                        );

                    } catch ( final JsonMappingException e ) {

                        throw new IllegalArgumentException(
                                String.format("unprocessable JSON schema; %s", e.getMessage()), e
                        );

                    } catch ( final JsonProcessingException e ) {

                        throw new IllegalArgumentException(
                                String.format("malformed JSON schema; %s", e.getMessage()), e
                        );

                    }
                })
                .orElseGet(() ->
                        ResponseFormat.ofJsonObject(ResponseFormatJsonObject.builder().build())
                )
        );
    }


    @Override
    public Optional<Value> apply(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                final ChatCompletionCreateParams.Builder builder=new ChatCompletionCreateParams.Builder();

                setup.accept(builder);

                return backoff(0, () -> Optional.of(text)
                        .filter(not(String::isBlank))
                        .flatMap(t -> client.chat().completions()
                                .create(builder
                                        .responseFormat(format())
                                        .addSystemMessage(prompt)
                                        .addUserMessage(t)
                                        .build()
                                )
                                .choices()
                                .getFirst()
                                .message()
                                .content()
                        )
                        .map(JSON::json)
                );

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<Value>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, String.format(
                "analysed <%s> (<%,d> chars) in <%,d> ms", elide(text), text.length(), elapsed
        )));

    }

}
