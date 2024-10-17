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

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import jakarta.json.JsonValue;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.function.UnaryOperator;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.rdf.Values.guarded;
import static com.metreeca.http.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.events.Events_.updated;
import static eu.ec2u.data.resources.Resources.locales;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.resources.Resources.updated;
import static eu.ec2u.data.things.Schema.*;
import static eu.ec2u.data.universities.University.Turku;
import static java.time.ZoneOffset.UTC;
import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
import static java.util.Arrays.stream;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;

public final class EventsTurkuCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/turku/city");

    private static final Frame Publisher=frame(

            field(ID, iri("https://kalenteri.turku.fi/")),
            field(TYPE, Organization),

            field(university, Turku.id),

            field(name,
                    literal("City of Turku / Event's Calendar", "en"),
                    literal("Turun kaupunki / Tapahtumakalenteri", Turku.language)
            ),

            field(about, OrganizationTypes.City)

    );


    private static final Pattern EOLPattern=Pattern.compile("\n+");


    public static void main(final String... args) {
        exec(() -> new EventsTurkuCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Instant now=Instant.now();


    @Override public void run() {
        update(connection -> {

            final List<Frame> events=Xtream.of(updated(Context, Publisher.id().orElseThrow()))

                    .flatMap(this::crawl)
                    .flatMap(this::event)

                    .collect(toList());

            final List<Frame> places=Xtream.from(events)

                    .filter(frame -> frame.id().orElseThrow().stringValue().startsWith("https://linkedevents-api.turku.fi/"))

                    .flatMap(event -> event.values(location, asFrame()).flatMap(f -> f.values(url, asIRI())))
                    .map(Value::stringValue)
                    .distinct()

                    .optMap(new GET<>(new JSON()))

                    .map(JSONPath::new)
                    .map(this::place)

                    .collect(toList());

            Xtream.from(

                            events,
                            places

                    )

                    .flatMap(Frame::stream)
                    .batch(0)

                    .forEach(new Events_.Loader(Context));

        });

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JsonValue> crawl(final Instant updated) {
        return Xtream.of(updated)

                .flatMap(new Fill<Instant>()
                        .model("https://api.hel.fi/linkedevents/v1/event/"
                                +"?last_modified_since={since}"
                        )
                        .value("since", since ->
                                LocalDate.ofInstant(since, UTC).format(ISO_LOCAL_DATE)
                        )
                )

                .loop(batch -> Xtream.of(batch)
                        .optMap(new GET<>(new JSON()))
                        .map(JSONPath::new)
                        .optMap(json -> json.string("meta.next"))
                )

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .flatMap(json -> json.values("data.*"));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> event(final JsonValue value) {
        return Xtream.of(value).map(JSONPath::new).optMap(json -> json.entries("info_url")

                .filter(entry -> locales().contains(entry.getKey()))
                .flatMap(entry -> entry.getValue().strings(""))
                .map(Strings::normalize)
                .filter(not(String::isBlank))
                .map(Frame::iri)
                .findFirst()

                .map(url -> {

                    final String id=json.string("@id").orElseThrow();

                    final Stream<Literal> shortDescription=json.entries("short_description")
                            .filter(entry -> locales().contains(entry.getKey()))
                            .map(this::local)
                            .flatMap(Optional::stream)
                            .map(this::normalize);

                    final Stream<Literal> fullDescription=json.entries("description")
                            .filter(entry -> locales().contains(entry.getKey()))
                            .map(this::local)
                            .flatMap(Optional::stream)
                            .map(l -> normalize(l, s -> EOLPattern.matcher(s).replaceAll("\n\n")));

                    return frame(

                            field(ID, iri(Events.Context, md5(id))),

                            field(RDF.TYPE, Event),

                            field(Schema.url, url),
                            field(name, label(json.entries("name"))),
                            field(image, json.strings("images.*.url").map(Frame::iri)),
                            field(disambiguatingDescription, shortDescription),
                            field(description, fullDescription),

                            field(isAccessibleForFree, json.bools("offers.*.is_free")
                                    .filter(v -> v)
                                    .findFirst()
                                    .map(Frame::literal)
                            ),

                            field(eventStatus, json.string("event_status")
                                    .filter(v -> stream(EventStatusType.values()).map(Enum::name).anyMatch(v::equals))
                                    .map(Schema::schema)
                            ),

                            field(startDate, json.string("start_time")
                                    .map(guarded(OffsetDateTime::parse))
                                    .map(Frame::literal)),

                            field(endDate, json.string("end_time")
                                    .map(guarded(OffsetDateTime::parse))
                                    .map(Frame::literal)),

                            // field(DCTERMS.ISSUED, json.string("date_published").map(v -> literal(v, XSD.DATETIME))),

                            field(dateCreated, json.string("created_time").map(v -> literal(v, XSD.DATETIME))),
                            field(dateModified, json.string("last_modified_time")
                                    .map(guarded(OffsetDateTime::parse))
                                    .map(Frame::literal)
                            ),

                            field(updated, literal(json.string("last_modified_time")
                                    .or(() -> json.string("created_time"))
                                    .map(guarded(OffsetDateTime::parse))
                                    .map(Instant::from)
                                    .orElse(now)
                            )),

                            // !!! keywords
                            // !!! in_language
                            // !!! audience

                            field(university, Turku.id),
                            field(publisher, Publisher),

                            field(location, location(json))

                    );

                }));
    }

    private Stream<Frame> location(final JSONPath json) {

        // !!! is_virtualevent // not populated as of 2022-07-25

        return json.string("location.@id")
                .map(Frame::iri)
                .map(iri -> frame(
                        field(ID, item(Locations.Context, iri.stringValue())),
                        field(RDF.TYPE, Place),
                        field(url, iri)
                ))
                .map(Stream::of)

                .or(() -> json.path("location_extra_info").map(location -> location.entries("")
                        .filter(entry -> locales().contains(entry.getKey()))
                        .optMap(entry -> entry.getValue().string("")
                                .map(Strings::normalize)
                                .map(info -> frame(
                                        field(ID, item(Locations.Context, info)),
                                        field(RDF.TYPE, Place),
                                        field(name, literal(info, entry.getKey()))
                                ))
                        )
                ))

                .orElseGet(Stream::empty);
    }

    private Frame place(final JSONPath json) {

        final String id=json.string("@id").orElseThrow();

        final Frame address=frame(

                field(ID, iri()), // !!! skolemize

                field(addressCountry, label(json.entries("address_country"))),
                field(addressRegion, label(json.entries("address_region"))),
                field(addressLocality, label(json.entries("address_locality"))),
                field(postalCode, label(json.entries("postal_code"))),
                field(streetAddress, label(json.entries("street_address"))),

                field(url, label(json.entries("info_url"))),
                field(email, label(json.entries("email"))),
                field(telephone, label(json.entries("telephone")))

        );

        return frame(

                field(ID, item(Locations.Context, id)),

                field(RDF.TYPE, json.string("@type").map(Schema::schema).orElse(Place)),

                field(url, iri(id)), // !!! skolemize

                field(name, label(json.entries("name"))),
                field(description, label(json.entries("description"))),

                // field(Schema.address, Optional.of(address)
                //         .filter(not(Frame::empty))
                //         .map(frame -> frame
                //
                //                 .value(RDF.TYPE, PostalAddress)
                //
                //                 .refocus(item(Locations.Context, skolemize(frame,  // !!! NOT_LOCALE
                //                         addressCountry,
                //                         addressRegion,
                //                         addressLocality,
                //                         postalCode,
                //                         streetAddress,
                //                         url,
                //                         email,
                //                         telephone
                //                 ))))
                // ),

                field(longitude, json.decimal("position.coordinates.0").map(Frame::literal)),
                field(latitude, json.decimal("position.coordinates.1").map(Frame::literal))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Literal> label(final Stream<Entry<String, JSONPath>> values) {
        return local(values).map(this::normalize);
    }


    private Stream<Literal> local(final Stream<Entry<String, JSONPath>> values) {
        return values
                .filter(entry -> locales().contains(entry.getKey()))
                .map(this::local)
                .flatMap(Optional::stream);
    }

    private Optional<Literal> local(final Entry<String, JSONPath> entry) {
        return entry.getValue().string("").map(text -> literal(text, entry.getKey()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Literal normalize(final Literal literal) {
        return normalize(literal, Strings::normalize);
    }

    private Literal untag(final Literal literal) {
        return normalize(literal, Untag::untag);
    }

    private Literal normalize(final Literal literal, final UnaryOperator<String> normalizer) {
        return literal.getLanguage()
                .map(lang -> literal(normalizer.apply(literal.stringValue()), lang))
                .orElseGet(() -> literal(normalizer.apply(literal.stringValue()), literal.getDatatype()));
    }

}
