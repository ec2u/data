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

import com.metreeca.json.Frame;
import com.metreeca.rest.Toolbox;
import com.metreeca.rest.Xtream;

import org.eclipse.rdf4j.model.*;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.Rio;

import java.io.*;
import java.util.Collection;
import java.util.List;

import static com.metreeca.core.Lambdas.task;
import static com.metreeca.rdf4j.services.Graph.graph;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.services.Logger.time;

import static eu.ec2u.data.Data.toolbox;

import static java.util.stream.Collectors.toList;

public final class Tasks {

    static { System.setProperty("com.sun.security.enableAIAcaIssuers", "true"); } // ;( retrieve missing certificates


    public static void exec(final Runnable... tasks) {
        toolbox(new Toolbox()).exec(tasks).clear();
    }


    public static void upload(final IRI context, final Collection<Frame> frames) {
        upload(context, Xtream.from(frames));
    }

    public static void upload(final IRI context, final Xtream<Frame> frames) {
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

        }).apply(elapsed -> service(logger()).info(Tasks.class, String.format(
                "updated <%d> resources in <%s> in <%d> ms", batch.size(), context, elapsed
        ))));
    }


    public static String format(final Frame frame) {
        return format(frame.model());
    }

    public static String format(final Iterable<Statement> model) {
        try ( final StringWriter writer=new StringWriter() ) {

            Rio.write(model, writer, RDFFormat.TURTLE);

            return writer.toString();

        } catch ( final IOException e ) {

            throw new UncheckedIOException(e);

        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Tasks() { }

}
