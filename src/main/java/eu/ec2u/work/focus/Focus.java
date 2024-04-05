/*
 * Copyright © 2023 Metreeca srl
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

package eu.ec2u.work.focus;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Stream;

public interface Focus {

    public static Focus focus(final Collection<Value> values, final Collection<Statement> statements) {

        if ( values == null || values.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null values");
        }

        if ( statements == null || statements.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null statements");
        }

        return new FocusModel(new LinkedHashSet<>(values), new LinkedHashSet<>(statements));
    }

    public static Focus focus(final Collection<Value> values, final RepositoryConnection connection) {

        if ( values == null || values.stream().anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null values");
        }

        if ( connection == null ) {
            throw new NullPointerException("null connection");
        }

        return new FocusConnection(new LinkedHashSet<>(values), connection);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public default Focus cache() { return this; }

    public Stream<Focus> split();


    public default Optional<Value> value() { return values().findFirst(); }

    public Stream<Value> values();


    public default <T> Optional<T> value(final Function<Value, T> converter) {

        if ( converter == null ) {
            throw new NullPointerException("null converter");
        }

        return value().map(guard(converter));
    }

    public default <T> Stream<T> values(final Function<Value, T> converter) {

        if ( converter == null ) {
            throw new NullPointerException("null converter");
        }
        return values().map(guard(converter)).filter(Objects::nonNull);
    }


    public Focus seq(final IRI step);

    public Focus seq(final IRI... steps);


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static <T> Function<Value, T> guard(final Function<Value, T> converter) {
        return value -> {

            try {

                return converter.apply(value);

            } catch ( final RuntimeException ignored ) {

                return null;

            }

        };
    }

}
