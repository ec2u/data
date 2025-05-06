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

import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.JSONPath;
import com.metreeca.flow.json.services.Analyzer;
import com.metreeca.flow.rdf4j.actions.Update;
import com.metreeca.flow.rdf4j.services.Graph;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.University;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Statement;
import org.eclipse.rdf4j.model.Value;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.services.Analyzer.analyzer;
import static com.metreeca.flow.rdf.Values.guarded;
import static com.metreeca.flow.rdf4j.services.Graph.graph;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Logger.time;
import static com.metreeca.flow.toolkits.Resources.resource;
import static com.metreeca.flow.toolkits.Resources.text;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.BASE;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.events.Events.EventAttendanceModeEnumeration.*;
import static eu.ec2u.work.xlations.Xlations.translate;
import static java.lang.String.format;
import static java.util.stream.Collectors.toSet;


final class Events_ {

    private Events_() { }


    //̸////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

    static final class Scanner implements Function<String, Optional<Frame>> {

        private final University university;

        private final Analyzer analyzer=service(analyzer());


        Scanner(final University university) {

            if ( university == null ) {
                throw new NullPointerException("null university");
            }

            this.university=university;
        }


        @Override public Optional<Frame> apply(final String url) {
            return Optional.of(url)

                    .flatMap(new GET<>(new HTML()))
                    .map(new Untag())

                    .flatMap(analyzer.prompt("""
                            Extract the following properties from the provided markdown document describing an academic event:
                            
                            - title
                            - plain text summary of about 500 characters
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

                    .map(JSONPath::new).map(event -> {

                        final URI base=URI.create(url);

                        final Optional<LocalDate> startDate=event
                                .string("startDate")
                                .map(guarded(LocalDate::parse));

                        final Optional<LocalTime> startTime=event
                                .string("startTime")
                                .map(guarded(LocalTime::parse));

                        final Optional<LocalDate> endDate=event
                                .string("endDate")
                                .map(guarded(LocalDate::parse));

                        final Optional<LocalTime> endTime=event
                                .string("endTime")
                                .map(guarded(LocalTime::parse));

                        final Optional<Events.EventAttendanceModeEnumeration> attendanceMode=event
                                .string("attendanceMode")
                                .map(value -> switch ( value ) {
                                    case "offline" -> OfflineEventAttendanceMode;
                                    case "online" -> OnlineEventAttendanceMode;
                                    case "mixed" -> MixedEventAttendanceMode;
                                    default -> null;
                                });

                        final Optional<Boolean> entryFees=event
                                .string("entryFees")
                                .map(value -> switch ( value ) {
                                    case "free" -> true;
                                    case "paid" -> false;
                                    default -> null;
                                });

                        final Optional<URI> attendanceURL=event
                                .string("attendanceURL")
                                .map(guarded(base::resolve));

                        final Optional<String> venueName=event
                                .string("venueName");

                        final Optional<String> venueAddress=event
                                .string("venueName");

                        final String language=event
                                .string("language")
                                .orElse(university.language); // unexpected

                        return frame(

                                field(ID, item(Events.Context, university, url)),
                                field(TYPE, Events.Event),

                                field(Resources.generated, literal(true)),
                                field(Resources.university, university.id),

                                field(Schema.url, iri(url)),
                                field(Schema.name, event.string("title").map(v -> literal(v, language))),

                                field(Schema.description, event
                                        .string("description")
                                        .map(v -> literal(v, language))
                                ),

                                field(Schema.disambiguatingDescription, event
                                        .string("summary")
                                        .map(v -> literal(v, language))
                                ),

                                field(Schema.image, event.string("imageURL")
                                        .map(guarded(base::resolve))
                                        .map(Frame::iri)
                                        .map(iri -> frame(

                                                field(ID, iri),
                                                field(TYPE, Schema.ImageObject),

                                                field(Schema.url, iri)

                                        ))
                                ),

                                field(Events.startDate, startDate
                                        .map(date -> startTime
                                                .map(time -> literal(date.atTime(time).atZone(university.zone)))
                                                .orElseGet(() -> literal(date.atStartOfDay().atZone(university.zone)))
                                        )
                                ),

                                field(Events.endDate, endDate
                                        .map(date -> endTime
                                                .map(time -> literal(date.atTime(time).atZone(university.zone)))
                                                .orElseGet(() -> literal(date.atStartOfDay().atZone(university.zone)))
                                        )
                                        .or(() -> startDate
                                                .flatMap(date -> endTime
                                                        .map(time -> literal(date.atTime(time).atZone(university.zone)))
                                                )
                                        )
                                ),


                                field(Events.eventAttendanceMode, attendanceMode),
                                field(Schema.isAccessibleForFree, entryFees.map(Frame::literal)),

                                // !!! field(Schema.about, event.strings("tags.*").map(tag -> frame(
                                //
                                //         field(ID, item(Topics, tag)),
                                //         field(TYPE, SKOS.CONCEPT),
                                //
                                //         field(SKOS.TOP_CONCEPT_OF, Topics),
                                //         field(SKOS.PREF_LABEL, literal(tag, language))
                                //
                                // ))),

                                field(Schema.location, attendanceURL.map(u -> frame(
                                        field(ID, item(Locations.Context, university, u.toString())),
                                        field(TYPE, Schema.VirtualLocation),
                                        field(Schema.url, iri(u))
                                ))),

                                field(Schema.location, venueAddress

                                        .map(a -> (Value)frame(
                                                field(ID, item(Locations.Context, university, a)),
                                                field(TYPE, Schema.PostalAddress),
                                                field(Schema.name, venueName.map(v -> literal(v, language))),
                                                field(Schema.streetAddress, literal(a))
                                        ))

                                        .or(() -> venueName.map(Frame::literal))

                                )

                        );
                    });
        }
    }
}
