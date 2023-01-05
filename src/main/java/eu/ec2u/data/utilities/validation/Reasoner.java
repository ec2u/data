/*
 * Copyright © 2020-2023 EC2U Alliance
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

package eu.ec2u.data.utilities.validation;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.*;
import java.util.function.Function;
import java.util.function.UnaryOperator;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.link.Values.pattern;
import static com.metreeca.link.Values.statement;
import static com.metreeca.rdf4j.services.Graph.graph;

import static java.util.stream.Collectors.toList;

 final class Reasoner implements UnaryOperator<Collection<Statement>> {

    private final List<Function<Collection<Statement>, Stream<Statement>>> rules;


    Reasoner() {

        this.rules=rules(service(graph()).query(connection -> Stream

                .of(
                        connection.getStatements(null, RDFS.SUBCLASSOF, null, true).stream(),
                        connection.getStatements(null, RDFS.SUBPROPERTYOF, null, true).stream(),
                        connection.getStatements(null, OWL.INVERSEOF, null, true).stream()
                )

                .flatMap(stream -> stream)
                .collect(toList())

        ));

    }


     @Override public Collection<Statement> apply(final Collection<Statement> statements) {

        final Collection<Statement> expanded=new HashSet<>(statements);

        while ( expanded.addAll(rules.stream()
                .flatMap(rule -> rule.apply(expanded))
                .collect(toList())
        ) ) { }

        return expanded;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private List<Function<Collection<Statement>, Stream<Statement>>> rules(final Collection<Statement> ontology) {
        return Stream

                .of(
                        subClassOf(ontology),
                        subPropertyOf(ontology),
                        inverseOf(ontology)
                )

                .flatMap(stream -> stream)
                .collect(toList());
    }


    private Stream<SubClassOf> subClassOf(final Collection<Statement> ontology) {
        return ontology.stream()
                .filter(pattern(null, RDFS.SUBCLASSOF, null))
                .filter(statement -> statement.getSubject().isIRI())
                .filter(statement -> statement.getObject().isIRI())
                .map(statement -> new SubClassOf((IRI)statement.getSubject(), (IRI)statement.getObject()));
    }

    private Stream<SubPropertyOf> subPropertyOf(final Collection<Statement> ontology) {
        return ontology.stream()
                .filter(pattern(null, RDFS.SUBPROPERTYOF, null))
                .filter(statement -> statement.getSubject().isIRI())
                .filter(statement -> statement.getObject().isIRI())
                .map(statement -> new SubPropertyOf((IRI)statement.getSubject(), (IRI)statement.getObject()));
    }

    private Stream<InverseOf> inverseOf(final Collection<Statement> ontology) {
        return ontology.stream()
                .filter(pattern(null, OWL.INVERSEOF, null))
                .filter(statement -> statement.getSubject().isIRI())
                .filter(statement -> statement.getObject().isIRI())
                .map(statement -> new InverseOf((IRI)statement.getSubject(), (IRI)statement.getObject()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class SubClassOf implements Function<Collection<Statement>, Stream<Statement>> {

        private final Value child;
        private final Value parent;

        private SubClassOf(final IRI child, final IRI parent) {
            this.child=child;
            this.parent=parent;
        }

        @Override public Stream<Statement> apply(final Collection<Statement> statements) {
            return statements.stream()
                    .filter(pattern(null, RDF.TYPE, child))
                    .map(statement -> statement(statement.getSubject(), RDF.TYPE, parent));
        }

    }

    private static final class SubPropertyOf implements Function<Collection<Statement>, Stream<Statement>> {

        private final IRI child;
        private final IRI parent;

        private SubPropertyOf(final IRI child, final IRI parent) {
            this.child=child;
            this.parent=parent;
        }

        @Override public Stream<Statement> apply(final Collection<Statement> statements) {
            return statements.stream()
                    .filter(pattern(null, child, null))
                    .map(statement -> statement(statement.getSubject(), parent, statement.getObject()));
        }

    }

    private static final class InverseOf implements Function<Collection<Statement>, Stream<Statement>> {

        private final IRI direct;
        private final IRI inverse;


        private InverseOf(final IRI direct, final IRI inverse) {
            this.direct=direct;
            this.inverse=inverse;
        }

        @Override public Stream<Statement> apply(final Collection<Statement> statements) {
            return statements.stream()
                    .filter(pattern(null, direct, null))
                    .filter(statement -> statement.getObject().isIRI())
                    .map(statement -> statement((Resource)statement.getObject(), inverse, statement.getSubject()));
        }

    }

}
