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
import java.util.function.UnaryOperator;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.util.Loggers.time;

import static eu.ec2u.work.ai.OpenAI.openai;
import static java.util.Objects.requireNonNull;
import static java.util.function.Predicate.not;

/**
 * OpenAI textual analyzer.
 *
 * <p>Extracts structured information from texts according to plain language prompts processed by the OpenAI
 * platform.</p>
 *
 * @see <a href="https://openai.com/api/">OpenAI Platform</a>
 * @see <a href="https://github.com/Azure/azure-sdk-for-java/tree/main/sdk/openai/azure-ai-openai">Azure OpenAI
 *         client library for Java</a>
 */
public final class OpenAnalyzer implements Analyzer {

    private final String model;
    private final UnaryOperator<ChatCompletionCreateParams.Builder> setup;

    private final String prompt;
    private final String schema;

    private ResponseFormat format;

    private final OpenAIClient client=service(openai());
    private final Logger logger=service(logger());


    public OpenAnalyzer(final String model) {
        this(model, options -> options);
    }

    public OpenAnalyzer(final String model, final UnaryOperator<ChatCompletionCreateParams.Builder> setup) {
        this(model, setup, "", "");
    }


    public OpenAnalyzer(
            final String model,
            final UnaryOperator<ChatCompletionCreateParams.Builder> setup,
            final String prompt,
            final String schema
    ) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        if ( model.isBlank() ) {
            throw new IllegalArgumentException("empty model");
        }

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

        if ( prompt == null ) {
            throw new NullPointerException("null prompt");
        }

        if ( schema == null ) {
            throw new NullPointerException("null schema");
        }

        this.model=model;
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
                model,
                setup,
                prompt,
                schema
        );
    }


    private ChatCompletionCreateParams.Builder params() {
        return requireNonNull(
                setup.apply(ChatCompletionCreateParams.builder().model(model)), // let setup override the default model
                "null setup return value"
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

                return Optional.of(text)
                        .filter(not(String::isBlank))
                        .flatMap(t -> client.chat().completions()
                                .create(params()
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
                        .map(JSON::json);

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                e.printStackTrace(); // !!!

                return Optional.<Value>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, String.format(
                "analysed <%s> (<%,d> chars) in <%,d> ms", _Texts.clip(text), text.length(), elapsed
        )));

    }

}
