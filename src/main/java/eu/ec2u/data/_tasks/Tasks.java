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

package eu.ec2u.data._tasks;

import com.metreeca.core.Locator;
import com.metreeca.core.Xtream;
import com.metreeca.jsonld.actions.Validate;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;

import eu.ec2u.data._.Reasoner;
import eu.ec2u.data._terms.EC2U;
import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.*;
import java.net.URL;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.services.Logger.time;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.core.toolkits.Resources.resource;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.inverse;
import static com.metreeca.link.Values.pattern;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.Data.services;

import static java.lang.String.format;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;

public final class Tasks {

    static { System.setProperty("com.sun.security.enableAIAcaIssuers", "true"); } // ;( retrieve missing certificates


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void exec(final Runnable... tasks) {
        services(new Locator()).exec(tasks).clear();
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static Xtream<URL> ontologies() {
        return Xtream

                .of(

                        resource(EC2U.class, ".ttl"),
                        resource(EC2U.class, "Institutes.ttl"),

                        resource(EC2U.class, "SKOS.ttl"),
                        resource(EC2U.class, "Org.ttl"),
                        resource(EC2U.class, "DCAT2.ttl"),

                        resource(EC2U.class, "Schema.ttl"),
                        resource(EC2U.class, "Wikidata.ttl")

                );
    }


    public static Collection<Statement> validate(
            final Shape shape, final Set<IRI> types, final Stream<Frame> frames
    ) {
        return validate(shape, types, frames, Stream.empty());
    }

    public static Collection<Statement> validate(
            final Shape shape, final Set<IRI> types, final Stream<Frame> frames, final Stream<Frame> context
    ) {

        final Reasoner reasoner=service(() -> new Reasoner(ontologies()

                .flatMap(url -> {

                    try ( final InputStream input=url.openStream() ) {

                        return Rio.parse(input, RDFFormat.TURTLE).stream();

                    } catch ( final IOException e ) {

                        throw new UncheckedIOException(e);

                    }

                })

                .collect(toSet()))
        );


        final List<Frame> batch=frames.collect(toList());

        final Set<Value> resources=batch.stream().map(Frame::focus).collect(toSet());

        final Collection<Statement> explicit=batch.stream().flatMap(Frame::stream).collect(toSet());
        final Collection<Statement> extended=reasoner.apply(Stream.concat(explicit.stream(),
                context.flatMap(Frame::stream)).collect(toSet()));

        final long mistyped=resources.stream()

                .filter(resource -> {

                    final boolean invalid=!resource.isResource() || extended.stream()
                            .filter(pattern(resource, RDF.TYPE, null))
                            .map(Statement::getObject)
                            .noneMatch(types::contains);

                    if ( invalid ) {

                        service(logger()).warning(Tasks.class, format(
                                "mistyped frame <%s> %s", resource, extended.stream()
                                        .filter(pattern(resource, RDF.TYPE, null))
                                        .map(Statement::getObject)
                                        .collect(toSet())
                        ));

                    }

                    return invalid;

                })

                .count();

        if ( mistyped > 0 ) {
            throw new IllegalArgumentException(format("<%d> mistyped frames in batch", mistyped));
        }

        final long invalid=types.stream()
                .flatMap(type -> frame(type, extended).frames(inverse(RDF.TYPE)))
                .map(new Validate(shape))
                .filter(Optional::isEmpty)
                .count();

        if ( invalid != 0 ) {
            throw new IllegalArgumentException(format("<%d> malformed frames in batch", invalid));
        }

        return explicit;
    }


    public static void upload(final IRI context, final Collection<Statement> model) {
        upload(context, model, () -> service(graph()).update(task(connection -> model.stream()
                .map(Statement::getSubject)
                .distinct()
                .forEach(subject ->
                        connection.remove(subject, null, null, context)
                )
        )));
    }

    public static void upload(final IRI context, final Collection<Statement> model, final Runnable setup) {

        final long subjects=model.stream()
                .map(Statement::getSubject)
                .distinct()
                .count();

        time(() -> {

            service(graph()).update(task(connection -> {

                setup.run();
                connection.add(model, context);

            }));

        }).apply(elapsed -> service(logger()).info(Tasks.class, format(
                "updated <%d> resources in <%s> in <%d> ms", subjects, context, elapsed
        )));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Tasks() { }

}
