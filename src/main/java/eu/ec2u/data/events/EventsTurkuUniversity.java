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

import com.metreeca.flow.actions.Fetch;
import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.actions.Query;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.rdf.Values;
import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.actions.Untag;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.organizations.Organizations;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work._junk.Frame;
import eu.ec2u.work._junk.JSONPath;
import eu.ec2u.work.feeds.Parsers;
import jakarta.json.Json;
import jakarta.json.JsonReader;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;

import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.rdf.Values.iri;
import static com.metreeca.flow.rdf.Values.literal;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.flow.toolkits.Formats.SQL_TIMESTAMP;
import static com.metreeca.flow.toolkits.Identifiers.md5;
import static com.metreeca.flow.toolkits.Strings.TextLength;
import static com.metreeca.flow.toolkits.Strings.clip;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.things.Schema.Organization;
import static eu.ec2u.data.things.Schema.location;
import static eu.ec2u.data.universities.University.Turku;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.joining;
import static java.util.stream.Collectors.toList;
import static org.eclipse.rdf4j.model.vocabulary.RDF.TYPE;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class EventsTurkuUniversity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/turku/city");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.utu.fi/event-search/")),
            field(TYPE, Organization),

            field(university, Turku.id),

            field(Schema.name,
                    literal("University of Turku / News", "en"),
                    literal("Turun yliopisto / Ajankohtaista", Turku.language)
            ),

            field(Schema.about, OrganizationTypes.University)

    );


    private static final String APIKey="events-turku-university-key"; // vault label


    private static Literal instant(final String timestamp, final Instant instant) {
        return literal(LocalDateTime.parse(timestamp, SQL_TIMESTAMP)
                .toInstant(Turku.zone.getRules().getOffset(instant))
        );
    }

    private static Literal datetime(final String timestamp, final Instant instant) {
        return literal(OffsetDateTime
                .of(LocalDateTime.parse(timestamp, SQL_TIMESTAMP), Turku.zone.getRules().getOffset(instant))
                .truncatedTo(ChronoUnit.SECONDS)
        );
    }


    public static void main(final String... args) {
        Data.exec(() -> new EventsTurkuUniversity().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    public void run() {
        update(connection -> Xtream.of(Instant.now())

                .flatMap(this::crawl)
                .optMap(this::event)

                .filter(frame -> frame.value(startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> crawl(final Instant now) {
        return Xtream.of(now)

                .flatMap(new Fill<Instant>()
                        .model("https://api-ext.utu.fi/events/v1/public")
                )

                .optMap(new Query(request -> request
                        .header("Accept", JSON.MIME)
                        .header("X-Api-Key", service(vault()).get(APIKey))
                ))

                // ;( returns JSON array as top-level object: unable to GET using JSONFormat

                .optMap(new Fetch())

                .optMap(response -> {

                    try (
                            final InputStream input=response.input().get();
                            final JsonReader reader=Json.createReader(input)

                    ) {

                        return Optional.of(reader.readArray());

                    } catch ( final Exception e ) {

                        service(logger()).error(this, "unable to parse message body", e);

                        return Optional.empty();

                    }

                })

                .map(JSONPath::new)
                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> event(final JSONPath json) {

        final Instant now=Instant.now();

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

        final Optional<String> url=json.string("additional_information.link.url")
                .or(() -> json.string("source_link"))
                .flatMap(Parsers::url);

        return json.integer("id").filter(id -> url.isPresent()).map(id -> frame(

                field(ID, iri(Events.Context, md5(Publisher.id().orElseThrow().stringValue()+id))),

                field(TYPE, Event),

                field(Schema.url, url
                        .map(Values::iri)
                ),

                field(Schema.name, title),
                field(Schema.description, description),
                field(Schema.disambiguatingDescription, excerpt),

                field(startDate, json.string("start_time").map(timestamp -> datetime(timestamp, now))),
                field(endDate, json.string("end_time").map(timestamp -> datetime(timestamp, now))),

                field(university, Turku.id),
                field(publisher, Publisher),
                field(organizer, json.paths("additional_information.contact").optMap(this::organizer)),

                field(location, json.path("location").flatMap(this::location))

        ));

    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> location(final JSONPath json) {
        return json.string("url").map(id -> {

            final Optional<String> name=json.string("free_text");
            final Optional<Value> url=json.string("url").flatMap(Parsers::url).map(Values::iri);
            final Optional<Value> addressCountry=Optional.ofNullable(Turku.country);
            final Optional<Value> addressLocality=Optional.ofNullable(Turku.city);
            final Optional<Value> postalCode=json.string("postal_code").map(Values::literal);
            final Optional<Value> streetAddress=json.string("street").map(Values::literal);

            // the same URL may be used for multiple events, e.g. `https://utu.zoom.us/j/65956988902`

            return frame(

                    field(ID, iri()),

                    field(Schema.Place, frame(

                            field(ID, item(Locations.Context, Xtream

                                    .of(
                                            Optional.of(id).map(Values::literal), name.map(Values::literal),
                                            url, addressCountry, addressLocality, postalCode, streetAddress
                                    )

                                    .optMap(value -> value)
                                    .map(Value::stringValue)
                                    .collect(joining("\n"))

                            )),

                            field(TYPE, Schema.Place),

                            field(Schema.url, url),
                            field(Schema.name, name.map(text -> literal(text, Turku.language))),

                            field(Schema.address, frame(

                                    field(ID, item(Locations.Context, Xtream

                                            .of(url, addressCountry, addressLocality, postalCode, streetAddress)

                                            .optMap(value -> value)
                                            .map(Value::stringValue)
                                            .collect(joining("\n"))

                                    )),

                                    field(TYPE, Schema.PostalAddress),

                                    field(Schema.addressCountry, addressCountry),
                                    field(Schema.addressLocality, addressLocality),
                                    field(Schema.postalCode, postalCode),
                                    field(Schema.streetAddress, streetAddress),

                                    field(Schema.url, url)

                            ))

                    ))

            );

        });
    }

    private Optional<Frame> organizer(final JSONPath json) {
        return json.string("url").map(id -> frame(

                field(ID, item(Organizations.Context, id)),

                field(TYPE, Organization),

                field(Schema.name, json.string("name").map(XPath::decode).map(text -> literal(text, Turku.language))),
                field(Schema.email, json.string("email").map(Values::literal))

        ));
    }

}
