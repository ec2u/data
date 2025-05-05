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
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.util.Locales;

import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.things.SchemaImageObjectFrame;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf.Values.guarded;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.*;
import static eu.ec2u.data.events.SchemaEvent.EventAttendanceModeEnumeration.*;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;

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
            .license(set(LICENSE)).issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> service(store()).curate(EVENTS));
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

        @Override public void run() {

            // time(() -> Stream.of(text(resource(Events_.class, ".ul")))
            //
            //         .forEach(new Update()
            //                 .base(BASE)
            //                 .dflt(context)
            //                 .insert(context)
            //                 .remove(context)
            //         )
            //
            // ).apply(elapsed -> service(logger()).info(Events.class, format(
            //         "purged stale events from <%s> in <%d> ms", context, elapsed
            // )));

        }

    }

    final class Scanner implements Function<String, Optional<EventFrame>> {

        private final University university;

        private final Analyzer analyzer=service(analyzer());


        Scanner(final University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override
        public Optional<EventFrame> apply(final String url) {
            return Optional.of(url)

                    .flatMap(new GET<>(new HTML()))
                    .map(new Untag())

                    .flatMap(analyzer.prompt("""
                            Extract the following properties from the provided markdown document describing an academic event:
                            
                            - title
                            - plain text summary of strictly less 500 characters with no markdown formatting
                            - complete descriptive text as included in the document in markdown format (don't include the title)
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
                            - tags
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
                                  "tags": {
                                    "type": "array",
                                    "items": {
                                      "type": "string"
                                    }
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

                    .map(json -> {

                        final URI base=URI.create(url);

                        final Optional<LocalDate> startDate=json
                                .get("startDate")
                                .string()
                                .map(guarded(LocalDate::parse));

                        final Optional<LocalTime> startTime=json
                                .get("startTime")
                                .string()
                                .map(guarded(LocalTime::parse));

                        final Optional<LocalDate> endDate=json
                                .get("endDate")
                                .string()
                                .map(guarded(LocalDate::parse));

                        final Optional<LocalTime> endTime=json
                                .get("endTime")
                                .string()
                                .map(guarded(LocalTime::parse));

                        final Optional<SchemaEvent.EventAttendanceModeEnumeration> attendanceMode=json
                                .get("attendanceMode")
                                .string()
                                .map(value -> switch ( value ) {
                                    case "offline" -> OfflineEventAttendanceMode;
                                    case "online" -> OnlineEventAttendanceMode;
                                    case "mixed" -> MixedEventAttendanceMode;
                                    default -> null;
                                });

                        final Optional<Boolean> entryFees=json
                                .get("entryFees")
                                .string()
                                .map(value -> switch ( value ) {
                                    case "free" -> true;
                                    case "paid" -> false;
                                    default -> null;
                                });

                        final Optional<URI> attendanceURL=json
                                .get("attendanceURL")
                                .string()
                                .map(guarded(base::resolve));

                        final Optional<String> venueName=json
                                .get("venueName")
                                .string();

                        final Optional<String> venueAddress=json
                                .get("venueName")
                                .string();

                        final Locale language=json
                                .get("language")
                                .string()
                                .map(guarded(Locales::locale))
                                .orElseGet(university::locale); // unexpected

                        return new EventFrame()

                                .generated(true)

                                .id(EVENTS.id().resolve(uuid(university, url)))
                                .university(university)

                                .url(set(uri(url)))

                                .name(json.get("title")
                                        .string()
                                        .map(t -> map(entry(language, t)))
                                        .orElse(null)
                                )

                                .disambiguatingDescription(json.get("summary")
                                        .string()
                                        .map(t -> map(entry(language, t)))
                                        .orElse(null)
                                )

                                .description(json.get("description")
                                        .string()
                                        .map(t -> map(entry(language, t)))
                                        .orElse(null)
                                )

                                .image(json.get("imageURL") // !!! related object
                                        .string()
                                        .map(guarded(base::resolve))
                                        .map(uri -> new SchemaImageObjectFrame()

                                                .id(uri)
                                                .url(set(uri))
                                        )
                                        .orElse(null)
                                )

                                .startDate(startDate
                                        .map(date -> startTime
                                                .map(time -> date.atTime(time).atZone(university.zone()))
                                                .orElseGet(() -> date.atStartOfDay().atZone(university.zone()))
                                        )
                                        .orElse(null)
                                )

                                .endDate(endDate
                                        .map(date -> endTime
                                                .map(time -> date.atTime(time).atZone(university.zone()))
                                                .orElseGet(() -> date.atStartOfDay().atZone(university.zone()))
                                        )
                                        .or(() -> startDate
                                                .flatMap(date -> endTime
                                                        .map(time -> date.atTime(time).atZone(university.zone())
                                                        )
                                                )
                                        )
                                        .orElse(null)
                                )


                                .eventAttendanceMode(attendanceMode.orElse(null))
                                .isAccessibleForFree(entryFees.orElse(null))

                                // !!! field(Schema.about, json.strings("tags.*").map(tag -> frame(
                                //
                                //         field(ID, item(Topics, tag)),
                                //         field(TYPE, SKOS.CONCEPT),
                                //
                                //         field(SKOS.TOP_CONCEPT_OF, Topics),
                                //         field(SKOS.PREF_LABEL, literal(tag, language))
                                //
                                // ))),

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

                                ;

                    });
        }
    }
}
