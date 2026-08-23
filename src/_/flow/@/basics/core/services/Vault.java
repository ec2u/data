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

package com.metreeca.flow.services;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.Properties;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;


/**
 * Secret vault.
 *
 * <p>Retrieves sensitive configuration parameters from safe system storage.</p>
 */
@FunctionalInterface
public interface Vault {

    /**
     * Retrieves the default vault factory.
     *
     * <p>The returned factory creates vault instances that retrieve parameters from multiple sources
     * in the following priority order:</p>
     *
     * <ul>
     *  <li>{@linkplain System#getProperties() system properties}</li>
     *  <li>{@linkplain System#getenv() environment variables}</li>
     *  <li>a {@code .env} file in the current working directory, if present</li>
     * </ul>
     *
     * <p><strong>Warning:</strong> {@code .env} files are parsed using
     * {@link Properties#load(InputStream)} and must follow the Java properties format
     * with ISO 8859-1 (Latin-1) encoding, which supports only a subset of standard {@code .env} syntax.</p>
     *
     * @return a supplier that creates vault instances using the default configuration
     *
     * @throws UncheckedIOException if an I/O error occurs while reading the {@code .env} file
     */
    public static Supplier<Vault> vault() {
        return () -> (id, fallback) -> {

            if ( id.isBlank() ) {
                throw new IllegalArgumentException("empty parameter id");
            }

            final Properties env=new Properties();

            final Path path=Paths.get(".env");

            if ( Files.exists(path) ) {
                try ( final InputStream input=Files.newInputStream(path) ) {
                    env.load(input);
                } catch ( final IOException e ) {
                    throw new UncheckedIOException(e);
                }
            }

            return Stream

                    .<UnaryOperator<String>>of(
                            System::getProperty,
                            System::getenv,
                            env::getProperty
                    )

                    .map(source -> source.apply(id))
                    .filter(Objects::nonNull)
                    .findFirst()

                    .orElseGet(() -> fallback.apply(id));
        };
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Retrieves a sensitive configuration parameters.
     *
     * @param id the unique identifier of the parameter to be retrieved
     *
     * @return the value of the parameter identified by {@code id}
     *
     * @throws NullPointerException     if {@code id} is null
     * @throws IllegalArgumentException if {@code id} is empty
     * @throws IllegalStateException    if no parameters identifed by {@code id} is present in the vault
     */
    public default String get(final String id) {

        if ( id == null ) {
            throw new NullPointerException("null id");
        }

        if ( id.isBlank() ) {
            throw new IllegalArgumentException("empty id");
        }

        return get(id, _id -> {

            throw new IllegalStateException("undefined id <%s>".formatted(id));

        });
    }

    /**
     * Retrieves a sensitive configuration parameters.
     *
     * @param id       the unique identifier of the parameter to be retrieved
     * @param fallback a fallback value generator, mapping from the provided id to a fallback value
     *
     * @return the value of the parameter identified by {@code id}, if one is present in the vault; the value returned
     *         by {@code fallback}, otherwise
     *
     * @throws NullPointerException     if {@code id} is null
     * @throws IllegalArgumentException if {@code id} is empty
     */
    public String get(final String id, final Function<String, String> fallback);

}
