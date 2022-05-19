/*
 * Copyright © 2021-2022 EC2U Consortium
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

package eu.ec2u.data.tasks.events;

import com.metreeca.json.Frame;
import com.metreeca.json.Values;
import com.metreeca.rest.Xtream;
import com.metreeca.rest.actions.*;
import com.metreeca.rest.formats.JSONFormat;
import com.metreeca.xml.actions.Untag;
import com.metreeca.xml.actions.XPath;

import eu.ec2u.data.cities.Turku;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import eu.ec2u.data.work.Work;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.io.InputStream;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import javax.json.Json;
import javax.json.JsonReader;

import static com.metreeca.core.Formats.SQL_TIMESTAMP;
import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Strings.TextLength;
import static com.metreeca.core.Strings.clip;
import static com.metreeca.json.Frame.frame;
import static com.metreeca.json.Values.iri;
import static com.metreeca.json.Values.literal;
import static com.metreeca.rest.Toolbox.service;
import static com.metreeca.rest.formats.InputFormat.input;
import static com.metreeca.rest.services.Logger.logger;
import static com.metreeca.rest.services.Vault.vault;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.exec;
import static eu.ec2u.data.tasks.Tasks.upload;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.lang.String.format;
import static java.time.ZoneOffset.UTC;
import static java.util.function.Function.identity;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;

public final class EventsTurkuUniversity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.utu.fi/event-search/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.University)
            .values(RDFS.LABEL,
                    literal("University of Turku / News", "en"),
                    literal("Turun yliopisto / Ajankohtaista", "fi")
            );

    private static final String APIKey="key-events-turku-university";


    private static Literal instant(final String timestamp) {
        return literal(OffsetDateTime
                .of(LocalDateTime.parse(timestamp, SQL_TIMESTAMP), Turku.Zone)
                .truncatedTo(ChronoUnit.SECONDS)
                .withOffsetSameInstant(UTC)
        );
    }

    private static Literal datetime(final String timestamp) {
        return literal(OffsetDateTime
                .of(LocalDateTime.parse(timestamp, SQL_TIMESTAMP), Turku.Zone)
                .truncatedTo(ChronoUnit.SECONDS)
        );
    }


    public static void main(final String... args) {
        exec(() -> new EventsTurkuUniversity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {

        final ZonedDateTime now=ZonedDateTime.now(UTC);

        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .map(event -> event

                        .value(EC2U.university, Turku.University)
                        .value(EC2U.updated, literal(now))

                        .frame(DCTERMS.PUBLISHER, Publisher)
                )

                .optMap(new Validate(Event()))

                .sink(events -> upload(EC2U.events, events));

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath.Processor> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://api-ext.utu.fi/events/v1/public")
                )

                .optMap(new Query(request -> request
                        .header("Accept", JSONFormat.MIME)
                        .header("X-Api-Key", service(vault())
                                .get(APIKey)
                                .orElseThrow(() -> new IllegalStateException(format(
                                        "undefined API key <%s>", APIKey
                                )))
                        )
                ))

                // ;( returns JSON array as top-level object: unable to GET using JSONFormat

                .optMap(new Fetch())
                .optMap(new Parse<>(input()))

                .optMap((supplier -> {

                    try (
                            final InputStream input=supplier.get();
                            final JsonReader reader=Json.createReader(input)

                    ) {

                        return Optional.of(reader.readArray());


                    } catch ( final Exception e ) {

                        service(logger()).error(this, "unable to parse message body", e);

                        return Optional.empty();

                    }

                }))

                .map(JSONPath.Processor::new)

                .flatMap(json -> json.paths("*"));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> event(final JSONPath.Processor json) {

        final List<Literal> title=json.entries("title")
                .optMap(entry -> entry.getValue()
                        .string("")
                        .map(XPath::decode)
                        .filter(not(String::isEmpty))
                        .map(text -> literal(text, entry.getKey()))
                )
                .collect(toList());

        final List<Literal> excerpt=json.entries("description")
                .optMap(entry -> entry.getValue()
                        .string("")
                        .map(Untag::untag)
                        .filter(not(String::isEmpty))
                        .map(v -> clip(v, TextLength))
                        .map(text -> literal(text, entry.getKey()))
                )
                .collect(toList());

        final List<Literal> description=json.entries("description")
                .optMap(entry -> entry.getValue()
                        .string("")
                        .map(Untag::untag)
                        .filter(not(String::isEmpty))
                        .map(text -> literal(text, entry.getKey()))
                )
                .collect(toList());

        return json.integer("id").map(id -> frame(iri(EC2U.events, md5(Publisher.focus().stringValue()+id)))

                .value(RDF.TYPE, EC2U.Event)

                .values(RDFS.LABEL, title)
                .values(RDFS.COMMENT, excerpt)

                .value(DCTERMS.SOURCE, json.string("source_link").flatMap(Work::url).map(Values::iri))

                .value(DCTERMS.CREATED, json.string("published").map(EventsTurkuUniversity::instant))
                .value(DCTERMS.MODIFIED, json.string("updated").map(EventsTurkuUniversity::instant))

                .value(Schema.url, json.string("additional_information.link.url")
                        .or(() -> json.string("source_link"))
                        .flatMap(Work::url)
                        .map(Values::iri)
                )

                .values(Schema.name, title)
                .values(Schema.description, description)
                .values(Schema.disambiguatingDescription, excerpt)

                .value(Schema.startDate, json.string("start_time").map(EventsTurkuUniversity::datetime))
                .value(Schema.endDate, json.string("end_time").map(EventsTurkuUniversity::datetime))

                .frame(Schema.location, json.path("location").flatMap(this::location))
                .frames(Schema.organizer, json.paths("additional_information.contact").optMap(this::organizer))

        );

    }

    private Optional<Frame> location(final JSONPath.Processor json) {
        return json.string("url").map(id -> {

            final Optional<Value> url=json.string("url").flatMap(Work::url).map(Values::iri);
            final Optional<Value> addressCountry=Optional.ofNullable(Turku.Country);
            final Optional<Value> addressLocality=Optional.ofNullable(Turku.City);
            final Optional<Value> postalCode=json.string("postal_code").map(Values::literal);
            final Optional<Value> streetAddress=json.string("street").map(Values::literal);

            return frame(iri(EC2U.locations, md5(id)))

                    .value(Schema.url, url)
                    .value(Schema.name, json.string("free_text").map(text -> literal(text, Turku.Language)))

                    .frame(Schema.address, frame(iri(EC2U.locations, md5(Xtream

                                    .of(url, addressCountry, addressLocality, postalCode, streetAddress)

                                    .optMap(identity())
                                    .map(Value::stringValue)
                                    .collect(joining("\n"))

                            )))

                                    .value(Schema.addressCountry, addressCountry)
                                    .value(Schema.addressLocality, addressLocality)
                                    .value(Schema.postalCode, postalCode)
                                    .value(Schema.streetAddress, streetAddress)

                                    .value(Schema.url, url)
                    );

        });

    }

    private Optional<Frame> organizer(final JSONPath.Processor json) {
        return json.string("url").map(id -> frame(iri(EC2U.organizations, md5(id)))

                .value(Schema.name, json.string("name").map(XPath::decode).map(text -> literal(text, Turku.Language)))
                .value(Schema.email, json.string("email").map(Values::literal))

        );
    }

}
