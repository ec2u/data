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

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.models.*;
import com.azure.json.JsonProviders;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.util.Loggers.time;

import static com.azure.ai.openai.models.ChatCompletionsJsonSchemaResponseFormatJsonSchema.fromJson;
import static eu.ec2u.work.ai.OpenAI.openai;
import static java.lang.String.format;
import static java.util.Objects.requireNonNull;

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
    private final UnaryOperator<ChatCompletionsOptions> setup;


    private final OpenAIClient client=service(openai());


    public OpenAnalyzer(final String model) { this(model, options -> options); }

    public OpenAnalyzer(final String model, final UnaryOperator<ChatCompletionsOptions> setup) {

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


    @Override public Function<String, Optional<Value>> prompt(final String prompt, final String schema) {

        if ( prompt == null ) {
            throw new NullPointerException("null prompt");
        }

        if ( prompt.isBlank() ) {
            throw new IllegalArgumentException("empty prompt");
        }

        if ( schema == null ) {
            throw new NullPointerException("null schema");
        }

        return new Processor(this, prompt, schema);

    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class Processor implements Function<String, Optional<Value>> {

        private final OpenAnalyzer ai;
        private final String prompt;
        private final ChatCompletionsResponseFormat format;

        private final Logger logger=service(logger());


        private Processor(final OpenAnalyzer ai, final String prompt, final String schema) {
            try {

                this.ai=ai;
                this.prompt=prompt;
                this.format=schema.isBlank()
                        ? new ChatCompletionsJsonResponseFormat()
                        : new ChatCompletionsJsonSchemaResponseFormat(fromJson(JsonProviders.createReader(schema)));

            } catch ( final RuntimeException e ) {

                throw new IllegalArgumentException("invalid JSON schema", e);

            } catch ( final IOException e ) {

                throw new UncheckedIOException(e);

            }
        }


        @Override public Optional<Value> apply(final String text) {

            if ( text == null ) {
                throw new NullPointerException("null text");
            }

            return time(() -> {

                try {

                    final List<ChatRequestMessage> messages=List.of(
                            new ChatRequestSystemMessage(prompt),
                            new ChatRequestUserMessage(text)
                    );

                    final ChatCompletions completions=ai.client.getChatCompletions(ai.model,
                            requireNonNull(ai.setup.apply(new ChatCompletionsOptions(messages)
                                    .setTemperature(1.0)
                                    .setTopP(1.0)
                                    .setMaxTokens(2048)
                                    .setFrequencyPenalty(0.0)
                                    .setPresencePenalty(0.0)
                            ), "null setup options")
                                    .setResponseFormat(format)
                    );

                    return Optional.of(JSON.json(completions.getChoices().getFirst().getMessage().getContent()));

                } catch ( final RuntimeException e ) {

                    logger.warning(this, e.getMessage());

                    return Optional.<Value>empty();

                }

            }).apply((elapsed, value) -> logger.info(this, format(
                    "analysed <%,d> chars in <%,d> ms", text.length(), elapsed
            )));

        }
    }

}
