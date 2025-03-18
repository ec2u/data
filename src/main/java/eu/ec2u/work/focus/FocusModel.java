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

import java.util.Arrays;
import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.rdf.Values.forward;
import static com.metreeca.flow.rdf.Values.reverse;

import static java.util.stream.Collectors.toUnmodifiableSet;

final class FocusModel implements Focus {

    private final Set<Value> values;
    private final Set<Statement> statements;


    FocusModel(final Set<Value> values, final Set<Statement> statements) {
        this.values=values;
        this.statements=statements;
    }


    @Override public Stream<Focus> split() {
        return values.stream().map(value -> new FocusModel(Set.of(value), statements));
    }


    @Override public Stream<Value> values() {
        return values.stream();
    }


    @Override public Focus seq(final IRI step) {

        if ( step == null ) {
            throw new NullPointerException("null step");
        }

        return new FocusModel(shift(values, step), statements);
    }

    @Override public Focus seq(final IRI... steps) {

        if ( steps == null || Arrays.stream(steps).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null steps");
        }

        Set<Value> next=values;

        for (final IRI step : steps) { next=shift(next, step); }

        return new FocusModel(next, statements);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Set<Value> shift(final Collection<Value> values, final IRI step) {
        return forward(step) ? recto(values, step) : verso(values, reverse(step));
    }

    private Set<Value> recto(final Collection<Value> values, final IRI step) {
        return statements.stream()
                .filter(statement -> step.equals(statement.getPredicate()))
                .filter(statement -> values.contains(statement.getSubject()))
                .map(Statement::getObject)
                .collect(toUnmodifiableSet());
    }

    private Set<Value> verso(final Collection<Value> values, final IRI step) {
        return statements.stream()
                .filter(statement -> step.equals(statement.getPredicate()))
                .filter(statement -> values.contains(statement.getObject()))
                .map(Statement::getSubject)
                .collect(toUnmodifiableSet());
    }

}
