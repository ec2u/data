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

package eu.ec2u.data.datasets.events;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.pipe.Store;
import com.metreeca.shim.Locales;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.organizations.OrganizationFrame;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.universities.University;
import eu.ec2u.data.vocabularies.schema.SchemaEvent.EventAttendanceModeEnumeration;
import eu.ec2u.data.vocabularies.schema.*;
import eu.ec2u.work.Page;
import eu.ec2u.work.PageFrame;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.BiFunction;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.Value.zonedDateTime;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Streams.concat;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.events.Event.review;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.time.ZoneOffset.UTC;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

@Frame
public interface Events extends Dataset {

    EventsFrame EVENTS=new EventsFrame()
            .id(Data.DATA.resolve("events/"))
            .isDefinedBy(Data.DATA.resolve("datasets/events"))
            .title(map(entry(EN, "EC2U Academic and Local Events")))
            .alternative(map(entry(EN, "EC2U Events")))
            .description(map(entry(EN, """
                    Information about events at EC2U partner universities and associated local organizations.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2022-01-01"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(EVENTS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Event> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {

            final EventFrame event=new EventFrame(true)
                    .image(new SchemaImageObjectFrame(true))
                    .location(new SchemaLocationFrame(true)
                            .String("")
                            .Place(new SchemaPlaceFrame(true)
                                    .address(new SchemaPostalAddressFrame(true))
                            )
                            .PostalAddress(new SchemaPostalAddressFrame(true))
                            .VirtualLocation(new SchemaVirtualLocationFrame(true))
                    );

            delegate(new Router()

                    .path("/", new Driver().retrieve(new EventsFrame(true)
                            .members(stash(query(event)))
                    ))

                    .path("/{code}", new Driver().retrieve(event))
            );
        }

    }

    final class Reaper implements Runnable {

        private final Store store=service(store());


        public static void main(final String... args) {
            exec(() -> new Reaper().run());
        }


        @Override public void run() {
            store.delete(value(query()
                    .model(new EventFrame(true).id(uri()))
                    .where("validDate", criterion().lt(zonedDateTime(LocalDate.now().atStartOfDay(UTC))))

            ));
        }

    }

    final class Scanner implements BiFunction<Page, EventFrame, Optional<EventFrame>> {

        private final Analyzer analyzer=service(analyzer());


        @Override
        public Optional<EventFrame> apply(final Page page, final EventFrame event) {
            return Optional.of(page.body()).flatMap(analyzer.prompt(format("""
                    Extract the following properties from the provided markdown document describing an academic event:
                    
                    - title
                    - plain text summary of less than 500 characters with strictly no markdown formatting
                    - complete descriptive text as included in the document in markdown format; make absolutely
                      sure not to include  in the description H1 (#) headings with the document title
                    - start date in ISO format, taking into account that the current date is %s
                    - start time in ISO format without seconds (hh:mm)
                    - end date in ISO format, taking into account that the current date is %s
                    - end time in ISO format without seconds (hh:mm)
                    - entry fees (free, paid); include only if absolutely confident; make sure not to mix up 
                      registration required with paid entry fees
                    - attendance mode (offline, online, mixed)
                    - attendance URL (make absolutely sure to include it only if attendance is online or mixed)
                    - venue name
                    - venue street address
                    - venue city name
                    - image URL (may include a query component), only if reasonably sure
                    - image credits or copyright
                    - major topic
                    - intended audience
                    - language as guessed from the description as a 2-letter ISO tag
                    
                    Don't include properties that are not defined in the document.
                    Don't include empty properties.
                    
                    Respond with a JSON object
                    """, LocalDate.now(), LocalDate.now()), """
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
                          "imageCredits": {
                            "type": "string"
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
            )).flatMap(json -> {

                final URI uri=page.id();

                final University university=event.university();
                final Locale language=language(json).orElseGet(university::locale);
                final ZoneId zone=university.zone();

                final Optional<LocalDate> startDate=startDate(json);
                final Optional<LocalTime> startTime=startTime(json);

                final Optional<LocalDate> endDate=endDate(json);
                final Optional<LocalTime> endTime=endTime(json);

                final Optional<SchemaImageObjectFrame> image=image(json, uri);

                final Optional<URI> attendanceURL=attendanceURL(json, uri);
                final Optional<String> venueName=venueName(json);
                final Optional<String> venueAddress=venueAddress(json);

                final Optional<SchemaLocationFrame> location=attendanceURL

                        .map(au -> new SchemaLocationFrame()
                                .VirtualLocation(new SchemaVirtualLocationFrame()
                                        .url(set(au))
                                )
                        )

                        .or(() -> venueAddress.map(va -> new SchemaLocationFrame()
                                .PostalAddress(new SchemaPostalAddressFrame()
                                        .name(venueName.map(vn -> map(entry(ROOT, vn))).orElse(null))
                                        .streetAddress(va)
                                )
                        ))

                        .or(() -> venueName.map(vn -> new SchemaLocationFrame()
                                .String(vn)
                        ));


                return review(event

                        .generated(true)

                        .id(EVENTS.id().resolve(uuid(university, uri.toString())))
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

                        .about(set(about(json).stream()))
                        .audience(set(audience(json).stream()))

                        .image(image.orElse(null))
                        .location(location.orElse(null))

                );

            });
        }


        private Optional<Locale> language(final Value json) {
            return json
                    .get("language")
                    .string()
                    .flatMap(lenient(Locales::locale));
        }


        private Optional<Map<Locale, String>> name(final Value json, final Locale language) {
            return json.get("title").string()
                    .map(t -> map(entry(language, t)));
        }

        private Optional<Map<Locale, String>> description(final Value json, final Locale language) {
            return json.get("description").string()
                    .map(t -> map(entry(language, t)));
        }

        private Optional<Map<Locale, String>> disambiguatingDescription(final Value json, final Locale language) {
            return json.get("summary").string()
                    .map(t -> map(entry(language, t)));
        }


        private Optional<LocalDate> startDate(final Value json) {
            return json
                    .get("startDate")
                    .string()
                    .flatMap(lenient(LocalDate::parse));
        }

        private Optional<LocalTime> startTime(final Value json) {
            return json
                    .get("startTime")
                    .string()
                    .flatMap(lenient(LocalTime::parse));
        }


        private Optional<LocalTime> endTime(final Value json) {
            return json
                    .get("endTime")
                    .string()
                    .flatMap(lenient(LocalTime::parse));
        }

        private Optional<LocalDate> endDate(final Value json) {
            return json
                    .get("endDate")
                    .string()
                    .flatMap(lenient(LocalDate::parse));
        }


        private Optional<Boolean> entryFees(final Value json) {
            return json
                    .get("entryFees")
                    .string()
                    .map(Event::entryFees);
        }

        private Optional<EventAttendanceModeEnumeration> attendanceMode(final Value json) {
            return json
                    .get("attendanceMode")
                    .string()
                    .map(Event::attendanceMode);
        }


        private Optional<URI> attendanceURL(final Value json, final URI base) {
            return json
                    .get("attendanceURL")
                    .string()
                    .flatMap(lenient(base::resolve));
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
            return json.get("imageURL").string()
                    .flatMap(lenient(base::resolve))
                    .map(uri -> new SchemaImageObjectFrame()
                            .url(set(uri))
                            .copyrightNotice(json.get("imageCredits").string()
                                    .filter(not(String::isBlank))
                                    .orElse(null)
                            )
                    );
        }


        private Optional<Topic> about(final Value json) {
            return json.get("topic").string().stream()
                    .flatMap(Event.events())
                    .findFirst();
        }

        private Optional<Topic> audience(final Value json) {
            return json.get("audience").string().stream()
                    .flatMap(Event.stakeholders())
                    .findFirst();
        }

    }

    final class _Scanner implements Function<Stream<String>, Stream<Valuable>> {

        private final University university;
        private final OrganizationFrame publisher;

        private final Store store=service(store());

        private final Analyzer analyzer=service(analyzer()).prompt("""
                Extract the following properties from the provided markdown document describing an academic event:
                
                - title
                - plain text summary of strictly less 500 characters with strictly no markdown formatting
                - complete descriptive text as included in the document in markdown format; make absolutely
                  sure not to include the document title in the description and to ignore other ancillary matters
                  such as page headers, footers, and navigation sections
                - start date in ISO format, taking into account that the current date is %s
                - start time in ISO format without seconds (hh:mm)
                - end date in ISO format, taking into account that the current date is %s
                - end time in ISO format without seconds (hh:mm)
                - entry fees (free, paid); make sure not to mix up registration required with paid entry fees
                - attendance mode (offline, online, mixed)
                - attendance URL (make absolutely sure to include it only for events with online and mixed attendance mode)
                - venue name
                - venue street address
                - venue city name
                - image URL (may include a query component), only if reasonably sure
                - image credits or copyright
                - major topic
                - intended audience
                - language as guessed from the description as a 2-letter ISO tag
                
                Don't include properties if not defined in the document.
                Don't include empty properties.
                Respond with a JSON object
                """.formatted(LocalDate.now(), LocalDate.now()), """
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
                      "imageCredits": {
                        "type": "string"
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
        );


        _Scanner(final University university, final OrganizationFrame publisher) {

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
        public Stream<Valuable> apply(final Stream<String> urls) {
            return urls

                    .map(url -> async(() -> Stream.of(url)

                            // ;( ignore all visited web pages: Last-Modified and ETag headers are not reliable

                            .filter(v -> store.retrieve(new PageFrame(true).id(uri(v))).isEmpty())

                            .flatMap(this::event)

                            // consume stream within async to ensure parallel processing

                            .toList()

                    ))

                    .collect(joining())
                    .flatMap(Collection::stream);
        }


        private Stream<Valuable> event(final String url) {
            return Stream.of(url)

                    .flatMap(optional(new GET<>(new HTML())))
                    .map(new Untag())
                    .flatMap(optional(analyzer))

                    .flatMap(json -> {

                        final URI uri=uri(url);

                        final Locale language=language(json);
                        final ZoneId zone=university.zone();

                        final Optional<LocalDate> startDate=startDate(json);
                        final Optional<LocalTime> startTime=startTime(json);

                        final Optional<LocalDate> endDate=endDate(json);
                        final Optional<LocalTime> endTime=endTime(json);

                        final Optional<SchemaImageObjectFrame> image=image(json, uri);

                        final Optional<URI> attendanceURL=attendanceURL(json, uri);
                        final Optional<String> venueName=venueName(json);
                        final Optional<String> venueAddress=venueAddress(json);

                        final Optional<SchemaLocationFrame> location=attendanceURL.map(au -> new SchemaLocationFrame()
                                        .VirtualLocation(new SchemaVirtualLocationFrame()
                                                .url(set(au))
                                        )
                                )

                                .or(() -> venueAddress.map(va -> new SchemaLocationFrame()
                                        .PostalAddress(new SchemaPostalAddressFrame()
                                                .name(venueName.map(vn -> map(entry(ROOT, vn))).orElse(null))
                                                .streetAddress(va)
                                        )
                                ))

                                .or(() -> venueName.map(vn -> new SchemaLocationFrame()
                                        .String(vn)
                                ));


                        final Optional<EventFrame> event=review(new EventFrame()

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

                                .about(set(about(json).stream()))
                                .audience(set(audience(json).stream()))

                                .publisher(publisher)
                                .image(image.orElse(null))
                                .location(location.orElse(null))
                        );


                        return concat(

                                event.stream(),
                                Stream.of(publisher),

                                // ;( keep track of all visited web pages to handle sources that expose stale events

                                Stream.of(new PageFrame()
                                        .id(uri)
                                        .fetched(Instant.now())
                                )

                        );

                    });
        }


        private Locale language(final Value json) {
            return json
                    .get("language")
                    .string()
                    .flatMap(lenient(Locales::locale))
                    .orElseGet(university::locale); // unexpected
        }


        private Optional<Map<Locale, String>> name(final Value json, final Locale language) {
            return json.get("title").string()
                    .map(t -> map(entry(language, t)));
        }

        private Optional<Map<Locale, String>> description(final Value json, final Locale language) {
            return json.get("description").string()
                    .map(t -> map(entry(language, t)));
        }

        private Optional<Map<Locale, String>> disambiguatingDescription(final Value json, final Locale language) {
            return json.get("summary").string()
                    .map(t -> map(entry(language, t)));
        }


        private Optional<LocalDate> startDate(final Value json) {
            return json
                    .get("startDate")
                    .string()
                    .flatMap(lenient(LocalDate::parse));
        }

        private Optional<LocalTime> startTime(final Value json) {
            return json
                    .get("startTime")
                    .string()
                    .flatMap(lenient(LocalTime::parse));
        }


        private Optional<LocalTime> endTime(final Value json) {
            return json
                    .get("endTime")
                    .string()
                    .flatMap(lenient(LocalTime::parse));
        }

        private Optional<LocalDate> endDate(final Value json) {
            return json
                    .get("endDate")
                    .string()
                    .flatMap(lenient(LocalDate::parse));
        }


        private Optional<Boolean> entryFees(final Value json) {
            return json
                    .get("entryFees")
                    .string()
                    .map(Event::entryFees);
        }

        private Optional<EventAttendanceModeEnumeration> attendanceMode(final Value json) {
            return json
                    .get("attendanceMode")
                    .string()
                    .map(Event::attendanceMode);
        }


        private Optional<URI> attendanceURL(final Value json, final URI base) {
            return json
                    .get("attendanceURL")
                    .string()
                    .flatMap(lenient(base::resolve));
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
            return json.get("imageURL").string()
                    .flatMap(lenient(base::resolve))
                    .map(uri -> new SchemaImageObjectFrame()
                            .url(set(uri))
                            .copyrightNotice(json.get("imageCredits").string()
                                    .filter(not(String::isBlank))
                                    .orElse(null)
                            )
                    );
        }


        private Optional<Topic> about(final Value json) {
            return json.get("topic").string().stream()
                    .flatMap(Event.events())
                    .findFirst();
        }

        private Optional<Topic> audience(final Value json) {
            return json.get("audience").string().stream()
                    .flatMap(Event.stakeholders())
                    .findFirst();
        }

    }

}
