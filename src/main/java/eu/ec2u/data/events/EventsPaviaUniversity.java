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

import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.services.Analyzer;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.events.Events.EventAttendanceModeEnumeration;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.data.universities.University;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.json.services.Analyzer.analyzer;
import static com.metreeca.http.rdf.Values.guarded;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.EventAttendanceModeEnumeration.*;
import static eu.ec2u.data.events.Events.Topics;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.universities.University.Pavia;
import static java.util.Map.entry;

public final class EventsPaviaUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/pavia/university");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.unipv.news/eventi")),
            field(TYPE, Schema.Organization),

            field(university, Pavia.id),

            field(Schema.name,
                    literal("University of Pavia / Events", "en"),
                    literal("Università di Pavia / Eventi", Pavia.language)
            ),

            field(Schema.about, OrganizationTypes.University)

    );


    public static void main(final String... args) {
        exec(() -> new EventsPaviaUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        update(connection -> Xtream.of("https://www.unipv.news/eventi")

                .crawl(url -> Xtream.of(url)

                        .optMap(new GET<>(new HTML()))

                        .map(XPath::new).map(path -> entry(
                                path.links("//a[contains(concat(' ', normalize-space(@class), ' '), ' page-link ')]/@href"),
                                path.links("//*[contains(concat(' ', normalize-space(@class), ' '), ' eventi-card ')]//a//@href")
                        ))
                )

                .optMap(this::event)

                .filter(frame -> frame.value(Events.startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }

    private Optional<Frame> event(final String url) {
        return Optional.of(url)

                .flatMap(new GET<>(new HTML()))
                .map(new Untag())

                .flatMap(analyzer.prompt("""
                        Extract the following properties from the provided markdown document describing an academic event:

                        - title
                        - summary of about 500 characters
                        - complete descriptive text included in the document in markdown format (exclude the title)
                        - start date in ISO format
                        - start time in ISO format without seconds
                        - end date in ISO format
                        - end time in ISO format without seconds
                        - attendance mode (offline, online, mixed)
                        - attendance fees (free, paid)
                        - attendance URL
                        - venue name
                        - venue street address
                        - image URL
                        - tags
                        - language as guessed from the description as a 2-letter ISO tag

                        Don't include properties if not in the document.
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
                              "attendanceMode": {
                                "type": "string"
                              },
                              "attendanceFees": {
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


                .map(JSONPath::new)
                .map(event -> event(url, event));
    }

    private Frame event(final String url, final JSONPath event) {

        final URI base=URI.create(url);
        final University university=Pavia;

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

        final Optional<EventAttendanceModeEnumeration> attendanceMode=event
                .string("attendanceMode")
                .map(value -> switch ( value ) {
                    case "offline" -> OfflineEventAttendanceMode;
                    case "online" -> OnlineEventAttendanceMode;
                    case "mixed" -> MixedEventAttendanceMode;
                    default -> null;
                });

        final Optional<Boolean> attendanceFees=event
                .string("attendanceFees")
                .map(value -> switch ( value ) {
                    case "free" -> true;
                    case "paid" -> false;
                    default -> null;
                });

        final Optional<URI> attendanceURL=event
                .string("attendanceURL")
                .map(base::resolve);

        final Optional<String> venueName=event
                .string("venueName");

        final Optional<String> venueAddress=event
                .string("venueName");

        final String language=event
                .string("language")
                .orElse("en"); // unexpected

        return frame(

                field(ID, item(Events.Context, university, url)),
                field(TYPE, Events.Event),

                field(Resources.university, university.id),
                field(Events.publisher, Publisher),

                field(Schema.url, iri(url)),
                field(Schema.name, event.string("title").map(v -> literal(v, language))),
                field(Schema.description, event.string("description").map(v -> literal(v, language))),
                field(Schema.disambiguatingDescription, event.string("summary").map(v -> literal(v, language))),
                field(Schema.image, event.string("imageURL").map(base::resolve).map(Frame::iri)),

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
                field(Schema.isAccessibleForFree, attendanceFees.map(Frame::literal)),

                field(Schema.about, event.strings("tags.*").map(tag -> frame(

                        field(ID, item(Topics, tag)),
                        field(TYPE, SKOS.CONCEPT),

                        field(SKOS.TOP_CONCEPT_OF, Topics),
                        field(SKOS.PREF_LABEL, literal(tag, language))

                ))),

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
    }

}
