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

import com.metreeca.core.services.Logger;
import com.metreeca.link.Values;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toSet;

final class FocusConnection implements Focus {

    private final Set<Value> values;
    private final RepositoryConnection connection;

    private final Map<Value, Set<Statement>> cache;


    FocusConnection(final Set<Value> values, final RepositoryConnection connection) {
        this(values, connection, new HashMap<>());
    }

    private FocusConnection(
            final Set<Value> values, final RepositoryConnection connection,
            final Map<Value, Set<Statement>> cache
    ) {
        this.values=values;
        this.connection=connection;
        this.cache=cache;
    }


    @Override public Focus cache() {

        final int before=cache.size();

        Logger.time(() -> {

            connection.prepareGraphQuery(format(

                            "construct { ?v ?p ?o . ?s ?q ?v } where {\n"
                                    +"\tvalues ?v { %s }\n"
                                    +"\toptional { ?v ?p ?o }\n"
                                    +"\toptional { ?s ?q ?v }\n"
                                    +"}",

                            values.stream()
                                    .filter(not(cache::containsKey))
                                    .map(Values::format)
                                    .collect(joining(" "))

                    ))

                    .evaluate()
                    .stream()

                    .collect(toSet())

                    .forEach(statement -> {

                        if ( values.contains(statement.getSubject()) ) {
                            cache.compute(statement.getSubject(), (value, statements) -> {

                                final Set<Statement> set=statements != null ? statements : new HashSet<>();

                                set.add(statement);

                                return set;

                            });
                        }

                        if ( values.contains(statement.getObject()) ) {
                            cache.compute(statement.getObject(), (value, statements) -> {

                                final Set<Statement> set=statements != null ? statements : new HashSet<>();

                                set.add(statement);

                                return set;

                            });
                        }

                    });

        }).apply(elapsed -> service(logger()).info(
                this, format("cached ‹%,d› resources in ‹%,d› ms", cache.size()-before, elapsed)
        ));

        return this;
    }

    @Override public Stream<Focus> split() {
        return values.stream().map(value -> new FocusConnection(Set.of(value), connection, cache));
    }


    @Override public Stream<Value> values() {
        return values.stream();
    }


    @Override public Focus seq(final IRI step) {

        if ( step == null ) {
            throw new NullPointerException("null step");
        }

        return new FocusConnection(recto(step).collect(toSet()), connection, cache);
    }

    @Override public Focus seq(final IRI... steps) {

        if ( steps == null || Arrays.stream(steps).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null steps");
        }

        Stream<Value> next=values.stream();

        for (final IRI step : steps) { next=recto(step); }

        return new FocusConnection(next.collect(toSet()), connection, cache);
    }


    @Override public Focus inv(final IRI step) {

        if ( step == null ) {
            throw new NullPointerException("null step");
        }

        return new FocusConnection(verso(step).collect(toSet()), connection, cache);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> recto(final IRI step) {
        return values.stream()

                .filter(Value::isResource)
                .map(Resource.class::cast)

                .flatMap(value -> Optional.ofNullable(cache.get(value))

                        .map(statements -> statements.stream()
                                .filter(statement -> statement.getSubject().equals(value))
                                .filter(statement -> statement.getPredicate().equals(step))
                        )

                        .orElseGet(() -> connection
                                .getStatements(value, step, null)
                                .stream()
                        )

                )

                .map(Statement::getObject);
    }

    private Stream<Resource> verso(final IRI step) {
        return values.stream()

                .flatMap(value -> Optional.ofNullable(cache.get(value))

                        .map(statements -> statements.stream()
                                .filter(statement -> statement.getObject().equals(value))
                                .filter(statement -> statement.getPredicate().equals(step))
                        )

                        .orElseGet(() -> connection
                                .getStatements(null, step, value)
                                .stream()
                        )

                )

                .map(Statement::getSubject);
    }

}
