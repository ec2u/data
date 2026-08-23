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

import com.metreeca.flow.gcp.GCPServer;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.text.services.Translator;

import com.google.cloud.translate.v3.LocationName;
import com.google.cloud.translate.v3.TranslateTextRequest;
import com.google.cloud.translate.v3.Translation;
import com.google.cloud.translate.v3.TranslationServiceClient;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.text.services.Translator.preprocess;
import static com.metreeca.shim.Locales.ANY;
import static com.metreeca.shim.Loggers.time;

import static java.lang.String.format;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;

/**
 * Google Cloud text translator.
 *
 * <p>Translates texts using the Google Cloud Platform Translation API.</p>
 *
 * @see <a href="https://cloud.google.com/translate/docs">Google Cloud Plaform - Cloud Translation</a>
 */
public final class GCPTranslatorV3 implements Translator, AutoCloseable {

    private static final LocationName parent=LocationName.of(GCPServer.project(), "global");

    private static final int ChunkLength=1024;
    private static final Pattern TokenPattern=Pattern.compile("\\S+(?:\\s+|$)");


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final TranslationServiceClient client;

    private final Logger logger=service(logger());


    /**
     * Creates a new Google Cloud text translator.
     */
    public GCPTranslatorV3() {
        try {

            this.client=TranslationServiceClient.create();

        } catch ( final IOException e ) {
            throw new UncheckedIOException(e);
        }
    }


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

                .of(client

                        .translateText(TranslateTextRequest.newBuilder()
                                .setParent(parent.toString())
                                .setMimeType("text/plain")
                                .setSourceLanguageCode(source.equals(ROOT) || source.equals(ANY)
                                        ? ""
                                        : source.toLanguageTag()
                                )
                                .setTargetLanguageCode(target.toLanguageTag())
                                .addAllContents(chunks(text))
                                .build()
                        )

                        .getTranslationsList()
                        .stream()

                        .map(Translation::getTranslatedText)
                        .collect(joining())

                )
                .filter(not(String::isBlank))

        ).apply((elapsed, translation) -> logger.info(this, format(
                "translated <%,d> chars from <%s> to <%s> in <%,d> ms",
                text.length(), source.toLanguageTag(), target.toLanguageTag(), elapsed
        ))));
    }

    @Override public void close() {
        client.close();
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    private List<String> chunks(final String text) {

        final List<String> chunks=new ArrayList<>();
        final StringBuilder chunk=new StringBuilder(ChunkLength);

        final Matcher matcher=TokenPattern.matcher(text);

        while ( matcher.find() ) {

            final String token=matcher.group();

            if ( chunk.length()+token.length() > ChunkLength ) {
                chunks.add(chunk.toString());
                chunk.setLength(0);
            }

            chunk.append(token);
        }

        if ( !chunk.isEmpty() ) {
            chunks.add(chunk.toString());
        }

        return chunks;

    }

}
