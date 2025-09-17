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

package eu.ec2u.work.ai.open;

import com.metreeca.flow.services.Logger;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.shim.Locales;

import com.openai.models.ResponseFormatText;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.chat.completions.ChatCompletionCreateParams.ResponseFormat;

import java.util.Locale;
import java.util.Optional;
import java.util.function.Consumer;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.text.services.Translator.preprocess;
import static com.metreeca.shim.Loggers.time;

import static eu.ec2u.work.ai.open.OpenAI.openai;
import static java.lang.String.format;
import static java.util.Locale.ENGLISH;

/**
 * OpenAI translator.
 *
 * <p>Translates text using models provided by the OpenAI platform.</p>
 *
 * @see OpenAI
 */
public final class OpenTranslator implements Translator {

    private static final String PROMPT="""
            - translate the provided %s text to %s
            - make absolutely sure to retain all textual content, without abridging it
            """;

    private static final ResponseFormat FORMAT=ResponseFormat.ofText(ResponseFormatText.builder().build());


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Consumer<ChatCompletionCreateParams.Builder> setup;

    private final OpenAI openai=service(openai());
    private final Logger logger=service(logger());


    public OpenTranslator(final String model) {
        this(builder -> builder.model(model));
    }

    public OpenTranslator(final Consumer<ChatCompletionCreateParams.Builder> setup) {

        if ( setup == null ) {
            throw new NullPointerException("null setup");
        }

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

                final ChatCompletionCreateParams.Builder builder=new ChatCompletionCreateParams.Builder();

                setup.accept(builder);

                return Optional.of(text)
                        .map(t -> builder
                                .responseFormat(FORMAT)
                                .addSystemMessage(format(PROMPT,
                                        source.equals(Locales.ANY) ? "" : target.getDisplayLanguage(ENGLISH),
                                        target.getDisplayLanguage(ENGLISH)
                                ))
                                .addUserMessage(t)
                                .build()
                        )
                        .flatMap(params -> openai.retry(params.model().asString(), 0, () -> openai
                                .client()
                                .chat()
                                .completions()
                                .create(params)
                                .choices()
                                .getFirst()
                                .message()
                                .content()
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
