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
import com.metreeca.link.Shape;

import eu.ec2u.data.concepts.Concepts;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.resources.Resources.Resource;
import static eu.ec2u.data.things.Schema.*;

public final class Events extends Delegator {

    public static final IRI Context=item("/events/");

    public static final IRI Topics=iri(Concepts.Context, "/event-topics");
    public static final IRI Audience=iri(Concepts.Context, "/event-audience");


    public static final IRI Event=schema("Event");

    public static final IRI startDate=schema("startDate");
    public static final IRI endDate=schema("endDate");
    public static final IRI duration=schema("duration");

    public static final IRI isAccessibleForFree=schema("isAccessibleForFree");

    public static final IRI organizer=schema("organizer");
    public static final IRI publisher=schema("publisher");

    public static final IRI audience=schema("audience");

    public static final IRI eventAttendanceMode=schema("eventAttendanceMode");
    public static final IRI eventStatus=schema("eventStatus");


    public enum EventAttendanceModeEnumeration {
        MixedEventAttendanceMode,
        OfflineEventAttendanceMode,
        OnlineEventAttendanceMode
    }

    public enum EventStatusType {
        EventScheduled,
        EventMovedOnline,
        EventPostponed,
        EventRescheduled,
        EventCancelled
    }


    private static Set<IRI> values(final Enum<?>[] values) {
        return Arrays
                .stream(values)
                .map(Enum::name)
                .map(Schema::schema)
                .collect(Collectors.toSet());
    }


    public static Shape Events() {
        return Dataset(Event());
    }

    public static Shape Event() {
        return shape(Event, Thing(),

                property(url, repeatable()),

                property(startDate, optional(dateTime())),
                property(endDate, optional(dateTime())),
                property(duration, optional(duration())),

                property(inLanguage, multiple(string())),
                property(isAccessibleForFree, optional(bool())),

                property(location, multiple(Location())),

                property(organizer, multiple(Organization(),
                        property(about, multiple(Concept(), scheme(OrganizationTypes.Scheme)))
                )),

                property(publisher, optional(Organization(),
                        property(about, multiple(Concept(), scheme(OrganizationTypes.Scheme)))
                )),

                property(about, multiple(Concept(), scheme(Topics))),
                property(audience, multiple(Concept(), scheme(Audience))),

                property(eventAttendanceMode, optional(Resource(), in(values(EventAttendanceModeEnumeration.values())))),
                property(eventStatus, optional(Resource(), in(values(EventStatusType.values()))))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Events.class, Event()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Events() {
        delegate(new Router()

                .path("/", handler(new Driver(Events()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(RDFS.MEMBER, query(

                                        frame(
                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD))
                                        )

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