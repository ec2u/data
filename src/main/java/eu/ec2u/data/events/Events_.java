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

package eu.ec2u.data.events;

import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.services.Graph;
import com.metreeca.http.services.Logger;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf4j.services.Graph.graph;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;

import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.work.xlations.Xlations.translate;
import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;


final class Events_ {

    private Events_() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Consumer<Collection<Statement>> {

        private final IRI context;

        private final Logger logger=service(logger());
        private final Graph graph=service(graph());


        public Loader(final IRI context) { this.context=context; }


        @Override public void accept(final Collection<Statement> model) {

            final Set<Resource> resources=model.stream()
                    .map(Statement::getSubject)
                    .collect(toSet());

            final List<Statement> translated=translate("en", model);

            time(() -> {

                graph.update(connection -> {

                    resources.forEach(subject ->
                            connection.remove(subject, null, null, context)
                    );

                    connection.add(translated, context);

                    return this;

                });

            }).apply(elapsed -> logger.info(Events.class, format(
                    "updated <%d> resources in <%s> in <%d> ms", resources.size(), context, elapsed
            )));

            // ;( SPARQL update won't take effect if executed inside the previous txn

            time(() -> Stream.of(text(resource(Events_.class, ".ul")))

                    .forEach(new Update()
                            .base(BASE)
                            .dflt(context)
                            .insert(context)
                            .remove(context)
                    )

            ).apply(elapsed -> service(logger()).info(Events.class, format(
                    "purged stale events from <%s> in <%d> ms", context, elapsed
            )));

        }

    }

}
