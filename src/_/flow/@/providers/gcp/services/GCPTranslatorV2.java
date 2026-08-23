/*
 * Copyright © 2020-2022 EC2U Alliance
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

package com.metreeca.flow.gcp.services;

import com.metreeca.flow.services.Logger;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.shim.Locales;

import com.google.cloud.translate.Translate;
import com.google.cloud.translate.Translate.TranslateOption;
import com.google.cloud.translate.TranslateOptions;

import java.util.Locale;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.text.services.Translator.preprocess;
import static com.metreeca.shim.Loggers.time;

import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

/**
 * Google Cloud text translator.
 *
 * <p>Translates texts using the Google Cloud Platform Translation API.</p>
 *
 * @see <a href="https://cloud.google.com/translate/docs">Google Cloud Plaform - Cloud Translation</a>
 */
public final class GCPTranslatorV2 implements Translator {

    private final Translate translate=TranslateOptions.getDefaultInstance().getService();

    private final Logger logger=service(logger());


    @Override public Optional<String> translate(final String text, final Locale source, final Locale target) {

        if ( text == null ) {
            throw new NullPointerException("null text");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        if ( target == null ) {
            throw new NullPointerException("null target");
        }

        return preprocess(text, source, target).orElseGet(() -> time(() -> Optional

                .of(translate

                        .translate(text, source.equals(ROOT) || source.equals(Locales.ANY) ? new TranslateOption[]{

                                TranslateOption.format("text"),
                                TranslateOption.targetLanguage(target.toLanguageTag())

                        } : new TranslateOption[]{

                                TranslateOption.format("text"),
                                TranslateOption.sourceLanguage(source.toLanguageTag()),
                                TranslateOption.targetLanguage(target.toLanguageTag())

                        })

                        .getTranslatedText()
                )

                .filter(not(String::isBlank))

        ).apply((elapsed, translation) -> logger.info(this, format(
                "translated <%,d> chars from <%s> to <%s> in <%,d> ms",
                text.length(), source.toLanguageTag(), target.toLanguageTag(), elapsed
        ))));

    }

}
