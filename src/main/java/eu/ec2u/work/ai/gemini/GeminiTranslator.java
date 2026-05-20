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
import com.metreeca.flow.text.services.Translator;
import com.metreeca.shim.Locales;

import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.Part;

import java.util.Locale;
import java.util.Optional;
import java.util.function.Consumer;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.text.services.Translator.preprocess;
import static com.metreeca.shim.Loggers.time;

import static eu.ec2u.work.ai.gemini.Gemini.gemini;
import static java.lang.String.format;
import static java.util.Locale.ENGLISH;

/**
 * Gemini translator.
 *
 * <p>Translates text using models provided by the Google Gemini platform.</p>
 *
 * @see Gemini
 */
public final class GeminiTranslator implements Translator {

    private static final String PROMPT="""
            - translate the provided %s text to %s
            - make absolutely sure to retain all textual content, without abridging it
            """;


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final String model;
    private final Consumer<GenerateContentConfig.Builder> setup;

    private final Gemini gemini=service(gemini());
    private final Logger logger=service(logger());


    public GeminiTranslator(final String model) {
        this(model, builder -> { });
    }

    public GeminiTranslator(final String model, final Consumer<GenerateContentConfig.Builder> setup) {

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
    public Optional<String> translate(final String text, final Locale source, final Locale target) {

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( target == null ) {
            throw new NullPointerException("null target");
        }

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        return preprocess(text, source, target).orElseGet(() -> time(() -> {

            try {

                final GenerateContentConfig.Builder builder=GenerateContentConfig.builder();

                setup.accept(builder);

                final GenerateContentConfig config=builder
                        .systemInstruction(Content.fromParts(Part.fromText(format(PROMPT,
                                source.equals(Locales.ANY) ? "" : target.getDisplayLanguage(ENGLISH),
                                target.getDisplayLanguage(ENGLISH)
                        ))))
                        .build();

                return Optional.of(text)
                        .map(t -> gemini.retry(model, 0, () -> gemini
                                .client()
                                .models
                                .generateContent(model, t, config)
                                .text()
                        ));

            } catch ( final RuntimeException e ) {

                logger.warning(this, e.getMessage());

                return Optional.<String>empty();

            }

        }).apply((elapsed, value) -> logger.info(this, format(
                "translated <%,d> chars from <%s> to <%s> in <%,d> ms",
                text.length(), source.toLanguageTag(), target.toLanguageTag(), elapsed
        ))));

    }

}
