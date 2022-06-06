/*
 * Copyright © 2021-2022 EC2U Consortium
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

package eu.ec2u.data.tasks;

import com.metreeca.http.Locator;
import com.metreeca.http.Xtream;
import com.metreeca.jsonld.actions.Validate;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.model.vocabulary.RDF;

import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Lambdas.task;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.inverse;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.Data.services;

import static java.lang.String.format;
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;

public final class Tasks {

    static { System.setProperty("com.sun.security.enableAIAcaIssuers", "true"); } // ;( retrieve missing certificates


    public static void exec(final Runnable... tasks) {
        services(new Locator()).exec(tasks).clear();
    }


    public static Collection<Statement> validate(final IRI type, final Shape shape, final Stream<Frame> frames) {

        final Collection<Statement> statements=frames
                .flatMap(frame -> frame.model().stream())
                .collect(toSet());

        final long invalid=frame(type, statements)
                .frames(inverse(RDF.TYPE))
                .map(new Validate(shape))
                .filter(Optional::isEmpty)
                .count();

        if ( invalid != 0 ) {
            throw new IllegalArgumentException(format("<%d> malformed frames in batch", invalid));
        }

        return statements;
    }

    public static void upload(final IRI context, final Collection<Statement> model) {

        final Set<Resource> subjects=model.stream()
                .map(Statement::getSubject)
                .collect(toSet());

        time(() -> {

            service(graph()).update(task(connection -> {

                subjects.forEach(subject ->
                        connection.remove(subject, null, null, context)
                );

                connection.add(model, context);

            }));

        }).apply(elapsed -> service(logger()).info(Tasks.class, format(
                "updated <%d> resources in <%s> in <%d> ms", subjects.size(), context, elapsed
        )));
    }


    //// !!! ///////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void _upload(final IRI context, final Collection<Frame> frames) {
        _upload(context, Xtream.from(frames));
    }

    public static void _upload(final IRI context, final Xtream<Frame> frames) {
        frames.batch(1000).forEach(batch -> time(() -> {

            final List<Resource> subjects=batch.stream()
                    .map(Frame::focus)
                    .filter(Resource.class::isInstance)
                    .map(Resource.class::cast)
                    .collect(toList());

            final List<Statement> statements=batch.stream()
                    .flatMap(frame -> frame.model().stream())
                    .collect(toList());

            service(graph()).update(task(connection -> {

                subjects.forEach(subject ->
                        connection.remove(subject, null, null, context)
                );

                connection.add(statements, context);

            }));

        }).apply(elapsed -> service(logger()).info(Tasks.class, format(
                "updated <%d> resources in <%s> in <%d> ms", batch.size(), context, elapsed
        ))));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Tasks() { }

}
