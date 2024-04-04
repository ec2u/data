/*
 * Copyright © 2020-2024 EC2U Alliance
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

package eu.ec2u.data;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.services.Logger;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;
import com.metreeca.link.Trace;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.documents.Documents;
import eu.ec2u.data.events.Events;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.units.Units;
import eu.ec2u.data.universities.Universities;
import eu.ec2u.data.universities._Universities;
import org.eclipse.rdf4j.common.exception.ValidationException;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF4J;
import org.eclipse.rdf4j.model.vocabulary.SHACL;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.query.impl.SimpleDataset;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.repository.RepositoryException;
import org.eclipse.rdf4j.repository.RepositoryResult;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.rdf4j.services.Graph.graph;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;
import static com.metreeca.http.toolkits.Identifiers.md5;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Frame.iri;
import static com.metreeca.link.Frame.literal;

import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;
import static org.eclipse.rdf4j.model.util.Statements.statement;
import static org.eclipse.rdf4j.query.QueryLanguage.SPARQL;


public final class EC2U extends Delegator {

    public static final String BASE="https://data.ec2u.eu/";
    private static final String TERMS=BASE+"terms/";

    private static final IRI RULE=term("rule");
    private static final IRI INFERENCES=item("~");

    private static final Pattern MD5Pattern=Pattern.compile("[a-f0-9]{32}");


    public static IRI item(final String name) {
        return iri(BASE, name);
    }

    public static IRI term(final String name) {
        return iri(TERMS, name);
    }


    public static IRI item(final IRI dataset, final String name) {
        return iri(dataset, "/"+(MD5Pattern.matcher(name).matches() ? name : md5(name)));
    }

    public static IRI item(final IRI dataset, final _Universities university, final String name) {
        return iri(dataset, "/"+(MD5Pattern.matcher(name).matches() ? name : md5(university.Id+"@"+name)));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public EC2U() {
        delegate(new Router()

                .path("/", new Datasets())
                .path("/resources/", new Resources())

                .path("/universities/*", new Universities())

                .path("/units/*", new Units())
                .path("/programs/*", new Programs())
                .path("/courses/*", new Courses())
                .path("/documents/*", new Documents())

                .path("/events/*", new Events())

                .path("/concepts/*", new Concepts())
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void create(final IRI context, final Class<?> master, final Shape... shapes) {
        update(connection -> {

            try {

                Stream

                        .of(

                                rdf(resource(master, ".ttl"), BASE),
                                List.of(statement(context, RULE, literal(text(resource(master, ".ul"))), null))

                        )

                        .forEach(new Upload()
                                .contexts(context)
                                .clear(true)
                        );


                final Collection<Statement> shacl=Shape.encode(shapes);

                shacl.stream()

                        .filter(statement -> statement.getPredicate().equals(SHACL.TARGET_CLASS))

                        .forEach(statement -> connection.remove(
                                null, SHACL.TARGET_CLASS, statement.getObject(), RDF4J.SHACL_SHAPE_GRAPH
                        ));

                Stream

                        .of(shacl)

                        .forEach(new Upload()
                                .contexts(RDF4J.SHACL_SHAPE_GRAPH)
                        );

                // !!! shape garbage collection

            } catch ( final RepositoryException e ) {

                if ( e.getCause() instanceof ValidationException ) {

                    final Model model=((ValidationException)e.getCause()).validationReportAsModel();

                    service(logger()).warning(EC2U.class, Trace.decode(model).toString());

                } else {

                    throw e;

                }

            }

        });
    }

    public static void update(final Consumer<RepositoryConnection> task) {
        service(graph()).update(connection -> {

            task.accept(connection);

            final Logger logger=service(logger());

            time(() -> {

                final SimpleDataset dataset=new SimpleDataset();

                dataset.addDefaultRemoveGraph(INFERENCES);
                dataset.setDefaultInsertGraph(INFERENCES);

                final List<Update> updates;

                try ( final RepositoryResult<Statement> statements=connection.getStatements(null, RULE, null) ) {
                    updates=statements.stream()
                            .map(Statement::getObject)
                            .map(Value::stringValue)
                            .filter(not(String::isBlank))
                            .map(update -> connection.prepareUpdate(SPARQL, update, BASE))
                            .peek(update -> update.setDataset(dataset))
                            .collect(toList());
                }

                connection.clear(INFERENCES);

                for (long current, previous=-1; (current=connection.size(INFERENCES)) > previous; previous=current) {

                    logger.info(EC2U.class, format("inferred <%,d> statements", current));

                    updates.forEach(Update::execute);
                }

            }).apply(elapsed -> logger.info(EC2U.class, format("updated <%s> in <%,d> ms", INFERENCES, elapsed)));

            return null;

        });
    }

    public static String skolemize(final Frame frame, final IRI... predicates) {

        if ( frame == null ) {
            throw new NullPointerException("null frame");
        }

        if ( predicates == null || Arrays.stream(predicates).anyMatch(Objects::isNull) ) {
            throw new NullPointerException("null predicates");
        }

        return md5(Arrays.stream(predicates)
                .flatMap(predicate -> frame.values(predicate)
                        .map(value -> format("'%s':'%s'", predicate, value))
                )
                .collect(joining("\0"))
        );
    }
}
