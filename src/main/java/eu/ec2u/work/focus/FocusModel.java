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

import org.eclipse.rdf4j.model.*;

import java.util.*;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toSet;

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

        return new FocusModel(recto(step).collect(toSet()), statements);
    }

    @Override public Focus seq(final IRI... steps) {

        if ( steps == null || Arrays.stream(steps).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null steps");
        }

        Stream<Value> next=values.stream();

        for (final IRI step : steps) { next=recto(step); }

        return new FocusModel(next.collect(toSet()), statements);
    }


    @Override public Focus inv(final IRI step) {

        if ( step == null ) {
            throw new NullPointerException("null step");
        }

        return new FocusModel(verso(step).collect(toSet()), statements);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> recto(final IRI step) {
        return statements.stream()
                .filter(statement -> step.equals(statement.getPredicate()))
                .filter(statement -> values.contains(statement.getSubject()))
                .map(Statement::getObject);
    }

    private Stream<Resource> verso(final IRI step) {
        return statements.stream()
                .filter(statement -> step.equals(statement.getPredicate()))
                .filter(statement -> values.contains(statement.getObject()))
                .map(Statement::getSubject);
    }

}
