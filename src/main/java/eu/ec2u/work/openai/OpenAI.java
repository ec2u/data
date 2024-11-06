/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.work.openai;

import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.services.Logger;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.ai.openai.models.*;
import com.azure.core.credential.KeyCredential;
import com.azure.json.JsonProviders;
import jakarta.json.JsonValue;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;

public final class OpenAI implements Function<String, Optional<JsonValue>> {

    private final String model;

    private final OpenAIClient client;


    private String system="";

    private ChatCompletionsResponseFormat format=new ChatCompletionsJsonResponseFormat();


    private final Logger logger=service(logger());


    public OpenAI(final String model, final String key) {

        if ( model == null ) {
            throw new NullPointerException("null model");
        }

        if ( key == null ) {
            throw new NullPointerException("null key");
        }

        this.model=model;

        this.client=new OpenAIClientBuilder()
                .credential(new KeyCredential(key))
                .buildClient();
    }


    public OpenAI system(final String system) {

        if ( system == null ) {
            throw new NullPointerException("null system");
        }

        this.system=system;

        return this;
    }

    public OpenAI schema(final String schema) {

        if ( schema == null ) {
            throw new NullPointerException("null schema");
        }

        try {

            this.format=new ChatCompletionsJsonSchemaResponseFormat(
                    ChatCompletionsJsonSchemaResponseFormatJsonSchema.fromJson(JsonProviders.createReader(schema))
            );

            return this;

        } catch ( final IOException e ) {
            throw new UncheckedIOException(e);
        }

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public Optional<JsonValue> apply(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                final List<ChatRequestMessage> messages=List.of(
                        new ChatRequestSystemMessage(system),
                        new ChatRequestUserMessage(text)
                );

                final ChatCompletions completions=client.getChatCompletions(model,
                        new ChatCompletionsOptions(messages).setResponseFormat(format)
                );

                return Optional.of(JSON.json(completions.getChoices().get(0).getMessage().getContent()));

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<JsonValue>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, "analysed <%d> chars in <%,d> ms".formatted(
                text.length(), elapsed
        )));

    }

}
