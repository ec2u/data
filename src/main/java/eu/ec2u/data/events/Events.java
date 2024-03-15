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

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.http.rdf4j.actions.TupleQuery;
import com.metreeca.http.rdf4j.actions.Update;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;

import eu.ec2u.data._EC2U;
import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.rdf4j.services.Graph.graph;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;
import static com.metreeca.http.toolkits.Resources.text;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data._EC2U.item;
import static eu.ec2u.data._EC2U.term;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resource.Resource;
import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;

public final class Events extends Delegator {

    public static final IRI Context=item("/events/");
    public static final IRI Scheme=iri(Concepts.Context, "/event-topics");

    public static final IRI Event=term("Event");


    public static Shape Events() {
        return Dataset(Event());
    }

    public static Shape Event() {
        return shape(Resource(), Schema.Event(),

                property(RDF.TYPE, hasValue(Event)),

                property(DCTERMS.MODIFIED, required(), instant()), // housekeeping timestamp
                property("fullDescription", Schema.description) // prevent clashes with dct:description

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Events() {
        delegate(new Router()

                .path("/", handler(new Driver(Events()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, Frame.literal("", "en")),

                                field(RDFS.MEMBER, query(

                                        frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, Frame.literal("", "en"))
                                        ),

                                        filter(RDF.TYPE, Event)

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(Event()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri())

                        )))

                ))
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static Instant synced(final IRI context, final Value publisher) {
        return Xtream

                .of("prefix ec2u: </terms/>\n"
                        +"prefix dct: <http://purl.org/dc/terms/>\n\n"
                        +"select (max(?modified) as ?synced) where {\n"
                        +"\n"
                        +"\t?event a ec2u:Event;\n"
                        +"\t\tdct:publisher ?publisher;\n"
                        +"\t\tdct:modified ?modified.\n"
                        +"\n"
                        +"}"
                )

                .flatMap(new TupleQuery()
                        .base(_EC2U.Base)
                        .binding("publisher", publisher)
                        .dflt(context)
                )

                .optMap(bindings -> literal(bindings.getValue("synced")))

                .map(Literal::temporalAccessorValue)
                .map(Instant::from)

                .findFirst()

                .orElseGet(() -> Instant.now().minus(Duration.ofDays(30)));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static final class Loader implements Runnable {

        public static void main(final String... args) {
            exec(() -> new Loader().run());
        }

        @Override public void run() {
            Stream

                    .of(rdf(Events.class, ".ttl", _EC2U.Base))

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );
        }
    }

    public static final class Updater implements Consumer<Collection<Statement>> {

        private final IRI context;

        public Updater(final IRI context) { this.context=context; }

        @Override public void accept(final Collection<Statement> model) {

            final Set<org.eclipse.rdf4j.model.Resource> resources=model.stream()
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

            time(() -> Stream.of(text(Events.class, ".ul"))

                    .forEach(new Update()
                            .base(_EC2U.Base)
                            .dflt(context)
                            .insert(context)
                            .remove(context)
                    )

            ).apply(elapsed -> service(logger()).info(Events.class, format(
                    "purged stale events  from <%s> in <%d> ms", context, elapsed
            )));

        }

    }

}