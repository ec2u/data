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
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.link.Frame;
import com.metreeca.link.Shape;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.stream.Stream;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.formats.RDF.rdf;
import static com.metreeca.http.toolkits.Resources.resource;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.filter;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.resources.Resources.localized;

public final class Events extends Delegator {

    public static final IRI Context=item("/events/");
    public static final IRI Scheme=iri(Concepts.Context, "/event-topics");

    public static final IRI Event=term("Event");


    public static Shape Events() {
        return Dataset(Event());
    }

    public static Shape Event() {
        return shape(Event, Resource(), Schema.Event(),

                property(RDF.TYPE, hasValue(Event)),

                property(DCTERMS.MODIFIED, required(instant())), // housekeeping timestamp
                property("fullDescription", Schema.description, optional(localized())) // ;( prevent clashes with dct:description

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream

                .of(rdf(resource(Events.class, ".ttl"), Base))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Events() {
        delegate(new Router()

                .path("/", handler(new Driver(Events()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, Frame.literal("", WILDCARD)),

                                field(RDFS.MEMBER, query(

                                        frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, Frame.literal("", WILDCARD))
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


}