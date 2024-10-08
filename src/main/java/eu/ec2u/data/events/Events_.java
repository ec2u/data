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

import com.metreeca.http.rdf4j.actions.TupleQuery;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.work.Xtream;

import org.eclipse.rdf4j.model.*;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.rdf4j.services.Graph.graph;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.http.toolkits.Resources.text;

import static eu.ec2u.data.EC2U.BASE;
import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;


final class Events_ {

    static Instant updated(final IRI context, final Value publisher) {
        return Xtream

                .of("prefix ec2u: </terms/>\n"
                        +
                        "PREFIX schema: <https://schema.org/>\n"+
                        "\n"
                        +"select (max(?updated) as ?instant) where {\n"
                        +"\n"
                        +"\t?event a schema:Event;\n"
                        +"\t\tschema:publisher ?publisher;\n"
                        +"\t\tec2u:updated ?updated.\n"
                        +"\n"
                        +"}"
                )

                .flatMap(new TupleQuery()
                        .base(BASE)
                        .binding("publisher", publisher)
                        .dflt(context)
                )

                .optMap(bindings -> literal(bindings.getValue("instant")))

                .map(Literal::temporalAccessorValue)
                .map(Instant::from)

                .findFirst()

                .orElseGet(() -> Instant.now().minus(Duration.ofDays(30)));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Events_() { }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Consumer<Collection<Statement>> {

        private final IRI context;


        public Loader(final IRI context) { this.context=context; }


        @Override public void accept(final Collection<Statement> model) {

            final Set<Resource> resources=model.stream()
                    .map(Statement::getSubject)
                    .collect(toSet());

            time(() -> {

                service(graph()).update(connection -> {

                    resources.forEach(subject ->
                            connection.remove(subject, null, null, context)
                    );

                    connection.add(model, context);

                    return this;

                });

            }).apply(elapsed -> service(logger()).info(Events.class, format(
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
