/*
 * Copyright © 2013-2025 Metreeca srl
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

package com.metreeca.flow.json.formats;

import com.metreeca.flow.http.Format;
import com.metreeca.flow.http.FormatException;
import com.metreeca.flow.http.Message;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.json.JSONCodec;
import com.metreeca.mesh.pipe.Codec;
import com.metreeca.mesh.pipe.CodecException;
import com.metreeca.mesh.pipe.Store;

import java.io.*;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Supplier;
import java.util.regex.Pattern;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.http.Response.BAD_REQUEST;


/**
 * JSON message format.
 *
 * @see <a href="https://javaee.github.io/jsonp/">JSR 374 - Java API for JSON Processing</a>
 */
public final class JSON implements Format<Value> {

    /**
     * The default MIME type for JSON messages ({@value}).
     */
    public static final String MIME="application/json";

    /**
     * A pattern matching JSON-based MIME types, for instance {@code application/ld+json}.
     */
    public static final Pattern MIMEPattern=Pattern.compile("(?i:^(text/json|application/(?:.*\\+)?json)$)"
    );


    /**
     * Retrieves the default wire format codec factory.
     *
     * @return the default wire format codec factory
     */
    public static Supplier<Codec> codec() {
        return JSONCodec::json;
    }

    /**
     * Retrieves the default data storage engine factory.
     *
     * @return the default data storage engine factory, which throws an exception reporting the service as undefined
     */
    public static Supplier<Store> store() {
        return () -> { throw new IllegalStateException("undefined store service"); };
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Parses a JSON value.
     *
     * @param json the JSON value to be parsed
     *
     * @return the JSON value parsed from {@code json}
     *
     * @throws NullPointerException if {@code json} is null
     * @throws FormatException      if {@code json} contains a malformed document
     */
    public static Value json(final String json) throws FormatException {

        if ( json == null ) {
            throw new NullPointerException("null json");
        }

        try {
            return service(codec()).decode(json);
        } catch ( final CodecException e ) {
            throw new FormatException(BAD_REQUEST, e.getMessage(), e);
        }
    }

    /**
     * Writes a JSON value.
     *
     * @param value the JSON value to be written
     *
     * @return the JSON representatin of {@code value}
     *
     * @throws NullPointerException if {@code value} is null
     */
    public static String json(final Value value) throws FormatException {

        if ( value == null ) {
            throw new NullPointerException("null json");
        }

        try {
            return service(codec()).encode(value);
        } catch ( final CodecException e ) {
            throw new FormatException(BAD_REQUEST, e.getMessage(), e);
        }
    }


    /**
     * Parses a JSON value.
     *
     * @param reader the reader the JSON value is to be parsed from
     *
     * @return the JSON value parsed from {@code reader}
     *
     * @throws NullPointerException if {@code reader} is null
     * @throws FormatException      if {@code reader} contains a malformed document
     */
    public static Value json(final Reader reader) throws FormatException, IOException {

        if ( reader == null ) {
            throw new NullPointerException("null reader");
        }

        try {
            return service(codec()).decode(reader);
        } catch ( final CodecException e ) {
            throw new FormatException(BAD_REQUEST, e.getMessage(), e);
        }
    }

    /**
     * Writes a JSON value.
     *
     * @param <W>    the type of the {@code writer} the JSON value is to be written to
     * @param writer the writer the JSON value is to be written to
     * @param value  the JSON value to be written
     *
     * @return the target {@code writer}
     *
     * @throws NullPointerException if either {@code writer} or {@code value} is null
     */
    public static <W extends Writer> W json(final W writer, final Value value) throws FormatException, IOException {

        if ( writer == null ) {
            throw new NullPointerException("null writer");
        }

        if ( value == null ) {
            throw new NullPointerException("null object");
        }

        try {
            return service(codec()).encode(writer, value);
        } catch ( final CodecException e ) {
            throw new FormatException(BAD_REQUEST, e.getMessage(), e);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @return {@value MIME}
     */
    @Override public String mime() {
        return MIME;
    }

    @Override public Class<Value> type() {
        return Value.class;
    }


    /**
     * @return the JSON payload decoded from the raw {@code message} {@linkplain Message#input()} or an empty optional
     *         if the {@code "Content-Type"} {@code message} header is not empty and is not matched by
     *         {@link #MIMEPattern}
     */
    @Override public Optional<Value> decode(final Message<?> message) {
        return Optional.of(message.type(MIME)).filter(MIMEPattern.asPredicate()).map(type -> {

            try (
                    final InputStream input=message.input().get();
                    final Reader reader=new InputStreamReader(input, message.charset())
            ) {

                return json(reader);

            } catch ( final UnsupportedEncodingException e ) {

                throw new FormatException(BAD_REQUEST, e.getMessage());

            } catch ( final IOException e ) {

                throw new UncheckedIOException(e);

            }

        });

    }

    /**
     * @return the target {@code message} with its {@code "Content-Type"} header configured to {@value #MIME}, unless
     *         already defined, and its raw {@linkplain Message#output(Consumer) output} configured to return the JSON
     *         {@code value}
     */
    @Override public <M extends Message<M>> M encode(final M message, final Value value) {
        return message

                .header("Content-Type", message.header("Content-Type").orElse(MIME))

                .output(output -> {
                    try ( final Writer writer=new OutputStreamWriter(output, message.charset()) ) {

                        json(writer, value);

                    } catch ( final IOException e ) {

                        throw new UncheckedIOException(e);

                    }
                });
    }

}
