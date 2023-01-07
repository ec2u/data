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

package eu.ec2u.data.events;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Statement;

import java.util.Collection;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.services.Logger.time;
import static com.metreeca.core.toolkits.Lambdas.task;
import static com.metreeca.rdf4j.services.Graph.graph;

import static java.lang.String.format;

public final class _Uploads {

    public static void upload(final IRI context, final Collection<Statement> model) {

        final long subjects=model.stream()
                .map(Statement::getSubject)
                .distinct()
                .count();

        time(() -> {

            service(graph()).update(task(connection -> {

                model.stream()
                        .map(Statement::getSubject)
                        .distinct()
                        .forEach(subject ->
                                connection.remove(subject, null, null, context)
                        );

                connection.add(model, context);

            }));

        }).apply(elapsed -> service(logger()).info(_Uploads.class, format(
                "updated <%d> resources in <%s> in <%d> ms", subjects, context, elapsed
        )));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private _Uploads() { }

}
