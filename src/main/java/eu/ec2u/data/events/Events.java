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
import org.eclipse.rdf4j.model.IRI;
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
import static eu.ec2u.data.resources.Resources.synced;
import static eu.ec2u.data.things.Schema.*;

public final class Events extends Delegator {

    public static final IRI Context=item("/events/");
    public static final IRI Scheme=iri(Concepts.Context, "/event-topics");

    public static final IRI _Publisher=term("Publisher");
    public static final IRI _College=term("College");
    public static final IRI _Association=term("Association");
    public static final IRI _City=term("City");


    //// Creative Work /////////////////////////////////////////////////////////////////////////////////////////////////

    public static final IRI dateCreated=schema("dateCreated");
    public static final IRI dateModified=schema("dateModified");


    //// Events ////////////////////////////////////////////////////////////////////////////////////////////////////////

    public enum EventStatus { EventScheduled, EventMovedOnline, EventPostponed, EventRescheduled, EventCancelled }

    public static final IRI Event=schema("Event");

    public static final IRI organizer=schema("organizer");
    public static final IRI isAccessibleForFree=schema("isAccessibleForFree");
    public static final IRI eventStatus=schema("eventStatus");
    public static final IRI location=schema("location");
    public static final IRI eventAttendanceMode=schema("eventAttendanceMode");
    public static final IRI startDate=schema("startDate");
    public static final IRI endDate=schema("endDate");


    public static Shape Events() {
        return Dataset(Event());
    }

    public static Shape Event() {
        return shape(Event, Thing(),

                property(eventStatus, optional(id())),

                property(startDate, optional(dateTime())),
                property(endDate, optional(dateTime())),

                property(inLanguage, multiple(string())),
                property(isAccessibleForFree, optional(bool())),
                property(eventAttendanceMode, multiple(id())),

                property(location, multiple(Location())),
                property(organizer, multiple(Organization())),

                property(synced, required(instant())) // housekeeping timestamp

        );
    }


    public static void main(final String... args) {
        exec(() -> Stream

                .of(rdf(resource(Events.class, ".ttl"), BASE))

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