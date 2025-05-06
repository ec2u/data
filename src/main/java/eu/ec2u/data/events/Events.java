/*
 * Copyright © 2020-2025 EC2U Alliance
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

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.tools.Store;
import com.metreeca.mesh.util.Locales;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.events.SchemaEvent.EventAttendanceModeEnumeration;
import eu.ec2u.data.organizations.OrganizationFrame;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.data.things.SchemaImageObjectFrame;
import eu.ec2u.data.things.SchemaThing;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf.Values.guarded;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.toolkits.Strings.clip;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.Value.zonedDateTime;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.Loggers.time;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.events.Event.review;
import static eu.ec2u.data.events.SchemaEvent.EventAttendanceModeEnumeration.*;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.taxonomies.EC2UEvents.EC2U_EVENTS;
import static eu.ec2u.data.taxonomies.EC2UStakeholders.EC2U_STAKEHOLDERS;
import static eu.ec2u.data.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.time.ZoneOffset.UTC;

@Frame
public interface Events extends Dataset {

    EventsFrame EVENTS=new EventsFrame()
            .id(DATA.resolve("events/"))
            .isDefinedBy(DATA.resolve("datasets/events"))
            .title(map(entry(EN, "EC2U Local Events")))
            .alternative(map(entry(EN, "EC2U Events")))
            .description(map(entry(EN, """
                    Information about events at EC2U allied universities and associated local organizations.
                    """)))
            .publisher(EC2U)
            .rights(COPYRIGHT)
            .license(set(CCBYNCND40))
            .issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(EVENTS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    Set<Event> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new EventsFrame(true)

                            .members(stash(query(new EventFrame(true))))

                    )))

                    .path("/{code}", new Worker().get(new Driver(new EventFrame(true))))
            );
        }

    }

    final class Reaper implements Runnable {

        private final Store store=service(store());


        public static void main(final String... args) {
            exec(() -> new Reaper().run());
        }


        @Override public void run() {

            time(() -> store.delete(value(query()
                    .model(new EventFrame(true).id(uri()))
                    .where("validDate", criterion().lt(zonedDateTime(LocalDate.now().atStartOfDay(UTC))))

            ))).apply((elapsed, count) -> service(logger()).info(Events.class, format(
                    "purged <%,d> stale events in <%d> ms", count, elapsed
            )));

        }

    }

    final class Scanner implements Function<String, Stream<Valuable>> {

        private final University university;
        private final OrganizationFrame publisher;

        private final Store store=service(store());
        private final Analyzer analyzer=service(analyzer());


        Scanner(final University university, final OrganizationFrame publisher) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            if ( publisher == null ) {
                throw new NullPointerException("null publisher");
            }

            this.university=university;
            this.publisher=publisher;
        }


        @Override
        public Stream<Valuable> apply(final String url) {
            return Xtream.of(url)

                    // ;( ignore all known URLs: Last-Modified and ETag headers are usually not consistent

                    .filter(v -> store.retrieve(value(query()
                            .model(new EventFrame())
                            .where("url", criterion().any(Value.uri(uri(v))))
                    )).isEmpty())

                    .optMap(new GET<>(new HTML()))
                    .map(new Untag())

                    .optMap(analyzer.prompt("""
                            Extract the following properties from the provided markdown document describing an academic event:
                            
                            - title
                            - plain text summary of strictly less 500 characters with strictly no markdown formatting
                            - complete descriptive text as included in the document in markdown format; make absolutely
                              sure to exclude the document title and other ancillary matters like page headers, footers,
                              and navigation sections
                            - start date in ISO format
                            - start time in ISO format without seconds
                            - end date in ISO format
                            - end time in ISO format without seconds
                            - entry fees (free, paid)
                            - attendance mode (offline, online, mixed)
                            - attendance URL
                            - venue name
                            - venue street address
                            - venue city name
                            - image URL
                            - major topic
                            - intended audience
                            - language as guessed from the description as a 2-letter ISO tag
                            
                            Don't include properties if not defined in the document.
                            Don't include empty properties.
                            Respond with a JSON object
                            """, """
                            {
                              "name": "event",
                              "schema": {
                                "type": "object",
                                "properties": {
                                  "title": {
                                    "type": "string"
                                  },
                                  "summary": {
                                    "type": "string"
                                  },
                                  "description": {
                                    "type": "string"
                                  },
                                  "startDate": {
                                    "type": "string",
                                    "format": "date"
                                  },
                                  "startTime": {
                                    "type": "string",
                                    "format": "time"
                                  },
                                  "endDate": {
                                    "type": "string",
                                    "format": "date"
                                  },
                                  "endTime": {
                                    "type": "string",
                                    "format": "time"
                                  },
                                  "entryFees": {
                                    "type": "string"
                                  },
                                  "attendanceMode": {
                                    "type": "string"
                                  },
                                   "attendanceURL": {
                                    "type": "string",
                                    "format": "uri"
                                  },
                                  "venueName": {
                                    "type": "string"
                                  },
                                  "venueAddress": {
                                    "type": "string"
                                  },
                                  "imageURL": {
                                    "type": "string",
                                    "format": "uri"
                                  },
                                  "topic": {
                                    "type": "string"
                                  },
                                  "audience": {
                                    "type": "string"
                                  },
                                  "language": {
                                    "type": "string",
                                    "pattern": "^[a-z]{2}$"
                                  }
                                },
                                "required": [
                                  "title",
                                  "description",
                                  "start date",
                                  "language"
                                ],
                                "additionalProperties": false
                              }
                            }
                            """
                    ))

                    .flatMap(json -> {

                        final URI uri=uri(url);

                        final Locale language=language(json);
                        final ZoneId zone=university.zone();

                        final Optional<LocalDate> startDate=startDate(json);
                        final Optional<LocalTime> startTime=startTime(json);

                        final Optional<LocalDate> endDate=endDate(json);
                        final Optional<LocalTime> endTime=endTime(json);

                        final Optional<URI> attendanceURL=attendanceURL(json, uri);
                        final Optional<String> venueName=venueName(json);
                        final Optional<String> venueAddress=venueAddress(json);

                        final EventFrame event=new EventFrame()

                                .generated(true)

                                .id(EVENTS.id().resolve(uuid(university, url)))
                                .university(university)

                                .url(set(uri))

                                .name(name(json, language).orElse(null))
                                .description(description(json, language).orElse(null))
                                .disambiguatingDescription(disambiguatingDescription(json, language).orElse(null))

                                .startDate(startDate
                                        .map(date -> startTime
                                                .map(time -> date.atTime(time).atZone(zone))
                                                .orElseGet(() -> date.atStartOfDay().atZone(zone))
                                        )
                                        .orElse(null)
                                )

                                .endDate(endDate
                                        .map(date -> endTime
                                                .map(time -> date.atTime(time).atZone(zone))
                                                .orElseGet(() -> date.atStartOfDay().atZone(zone))
                                        )
                                        .or(() -> startDate
                                                .flatMap(date -> endTime
                                                        .map(time -> date.atTime(time).atZone(zone)
                                                        )
                                                )
                                        )
                                        .orElse(null)
                                )

                                .eventAttendanceMode(attendanceMode(json).orElse(null))
                                .isAccessibleForFree(entryFees(json).orElse(null))


                                // field(Schema.location, attendanceURL.map(u -> frame(
                                //         field(ID, item(Locations.Context, university, u.toString())),
                                //         field(TYPE, Schema.VirtualLocation),
                                //         field(Schema.url, iri(u))
                                // ))),
                                //
                                // field(Schema.location, venueAddress
                                //
                                //         .map(a -> (Value)frame(
                                //                 field(ID, item(Locations.Context, university, a)),
                                //                 field(TYPE, Schema.PostalAddress),
                                //                 field(Schema.name, venueName.map(v -> literal(v, language))),
                                //                 field(Schema.streetAddress, literal(a))
                                //         ))
                                //
                                //         .or(() -> venueName.map(Frame::literal))
                                //
                                // )

                                .about(set(topic(json).stream()))
                                .audience(set(audience(json).stream()));


                        final Optional<SchemaImageObjectFrame> image=image(json, uri);


                        return Xtream.<Valuable>from(

                                review(

                                        event
                                                .publisher(publisher)
                                                .image(image.orElse(null)),

                                        university.locale()

                                ).stream(),

                                Stream.of(publisher),
                                image.stream()

                        );

                    });
        }


        private Locale language(final Value json) {
            return json
                    .get("language")
                    .string()
                    .map(guarded(Locales::locale))
                    .orElseGet(university::locale); // unexpected
        }


        private Optional<Map<Locale, String>> name(final Value json, final Locale language) {
            return json.get("title").string()
                    .map(t -> clip(t, SchemaThing.NAME_LENGTH))
                    .map(t -> map(entry(language, t)));
        }

        private Optional<Map<Locale, String>> description(final Value json, final Locale language) {
            return json.get("description").string()
                    .map(t -> clip(t, SchemaThing.DESCRIPTION_LENGTH))
                    .map(t -> map(entry(language, t)));
        }

        private Optional<Map<Locale, String>> disambiguatingDescription(final Value json, final Locale language) {
            return json.get("summary").string()
                    .map(t -> clip(t, SchemaThing.DISAMBIGUATING_DESCRIPTION_LENGTH))
                    .map(t -> map(entry(language, t)));
        }


        private Optional<LocalDate> startDate(final Value json) {
            return json
                    .get("startDate")
                    .string()
                    .map(guarded(LocalDate::parse));
        }

        private Optional<LocalTime> startTime(final Value json) {
            return json
                    .get("startTime")
                    .string()
                    .map(guarded(LocalTime::parse));
        }


        private Optional<LocalTime> endTime(final Value json) {
            return json
                    .get("endTime")
                    .string()
                    .map(guarded(LocalTime::parse));
        }

        private Optional<LocalDate> endDate(final Value json) {
            return json
                    .get("endDate")
                    .string()
                    .map(guarded(LocalDate::parse));
        }


        private Optional<Boolean> entryFees(final Value json) {
            return json
                    .get("entryFees")
                    .string()
                    .map(value -> switch ( value ) {
                        case "free" -> true;
                        case "paid" -> false;
                        default -> null;
                    });
        }

        private Optional<EventAttendanceModeEnumeration> attendanceMode(final Value json) {
            return json
                    .get("attendanceMode")
                    .string()
                    .map(value -> switch ( value ) {
                        case "offline" -> OfflineEventAttendanceMode;
                        case "online" -> OnlineEventAttendanceMode;
                        case "mixed" -> MixedEventAttendanceMode;
                        default -> null;
                    });
        }


        private Optional<URI> attendanceURL(final Value json, final URI base) {
            return json
                    .get("attendanceURL")
                    .string()
                    .map(guarded(base::resolve));
        }

        private Optional<String> venueName(final Value json) {
            return json
                    .get("venueName")
                    .string();
        }

        private Optional<String> venueAddress(final Value json) {
            return json
                    .get("venueAddress")
                    .string();
        }


        private Optional<SchemaImageObjectFrame> image(final Value json, final URI base) {
            return json.get("imageURL")
                    .string()
                    .map(guarded(base::resolve))
                    .map(uri -> new SchemaImageObjectFrame()
                            .id(uri)
                            .url(set(uri))
                    );
        }


        private Optional<TopicFrame> topic(final Value json) {
            return json.get("topic").string()
                    .flatMap(t -> Resources.match(EC2U_EVENTS.id(), t))
                    .map(t -> new TopicFrame(true).id(t));
        }

        private Optional<TopicFrame> audience(final Value json) {
            return json.get("audience").string()
                    .flatMap(t -> Resources.match(EC2U_STAKEHOLDERS.id(), t))
                    .map(t -> new TopicFrame(true).id(t));
        }

    }

}
