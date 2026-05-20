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

import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.mesh.Value;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Part;
import eu.ec2u.work.ai.Analyzer;

import java.util.Optional;
import java.util.function.Consumer;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Loggers.elide;
import static com.metreeca.shim.Loggers.time;

import static eu.ec2u.work.ai.gemini.Gemini.gemini;
import static java.util.function.Predicate.not;

/**
 * Gemini textual analyzer.
 *
 * <p>Extracts structured information from texts according to plain language prompts processed by the Google Gemini
 * platform.</p>
 *
 * @see Gemini
 */
public final class GeminiAnalyzer implements Analyzer {

    private final String model;
    private final Consumer<GenerateContentConfig.Builder> setup;

    private final String prompt;
    private final String schema;

    private Object json;

    private final Gemini gemini=service(gemini());
    private final Logger logger=service(logger());


    public GeminiAnalyzer(final String model) {
        this(model, builder -> { });
    }

    public GeminiAnalyzer(final String model, final Consumer<GenerateContentConfig.Builder> setup) {
        this(model, setup, "", "");
    }


    public GeminiAnalyzer(
            final String model,
            final Consumer<GenerateContentConfig.Builder> setup,
            final String prompt,
            final String schema
    ) {

        if ( model == null ) {
            throw new NullPointerException("null model");
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

        return new GeminiAnalyzer(
                model,
                setup,
                prompt,
                schema
        );
    }


    private Object schema() {
        return json != null ? json : (json=Optional.of(schema)
                .filter(not(String::isBlank))
                .map(s -> {
                    try {

                        return new ObjectMapper().readValue(s, Object.class);

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
                .orElse("")
        );
    }


    @Override
    public Optional<Value> apply(final String text) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return time(() -> {

            try {

                final GenerateContentConfig.Builder builder=GenerateContentConfig.builder();

                setup.accept(builder);

                builder
                        .systemInstruction(Content.fromParts(Part.fromText(prompt)))
                        .responseMimeType("application/json");

                Optional.of(schema())
                        .filter(not(""::equals))
                        .ifPresent(builder::responseJsonSchema);

                final GenerateContentConfig config=builder.build();

                return Optional.of(text)
                        .filter(not(String::isBlank))
                        .map(t -> gemini.retry(model, 0, () -> gemini
                                .client()
                                .models
                                .generateContent(model, t, config)
                                .text()
                        ))
                        .map(JSON::json);

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<Value>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, String.format(
                "analysed <%s> (<%,d> chars) in <%,d> ms", elide(text), text.length(), elapsed
        )));

    }

}
