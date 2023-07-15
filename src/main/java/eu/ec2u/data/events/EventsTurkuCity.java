/*
 * Copyright © 2020-2023 EC2U Alliance
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
import com.metreeca.http.rdf.Frame;
import com.metreeca.http.rdf.Values;
import com.metreeca.http.toolkits.Strings;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.actions.Untag;

import eu.ec2u.data.Data;
import eu.ec2u.data.EC2U;
import eu.ec2u.data.locations.Locations;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.XSD;

import javax.json.JsonValue;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.function.UnaryOperator;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.rdf.Frame.frame;
import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.rdf.Values.literal;
import static com.metreeca.http.toolkits.Identifiers.md5;

import static eu.ec2u.data.EC2U.University.Turku;
import static eu.ec2u.data.EC2U.item;
import static java.time.ZoneOffset.UTC;
import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
import static java.util.Arrays.stream;
import static java.util.function.Predicate.not;

public final class EventsTurkuCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/turku/city");

    private static final Pattern EOLPattern=Pattern.compile("\n+");

    private static final Frame Publisher=frame(iri("https://kalenteri.turku.fi/"))
            .value(RDF.TYPE, Resources.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("City of Turku / Event's Calendar", "en"),
                    literal("Turun kaupunki / Tapahtumakalenteri", Turku.Language)
            );


    public static void main(final String... args) {
        Data.exec(() -> new EventsTurkuCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {

        // final List<Frame> events=Xtream.of(synced(Context, Publisher.focus()))
        //
        //         .flatMap(this::crawl)
        //         .flatMap(this::event)
        //
        //         .collect(toList());
        //
        // final List<Frame> places=Xtream.from(events)
        //
        //         .filter(frame -> frame.focus().stringValue().startsWith("https://linkedevents-api.turku.fi/"))
        //
        //         .optMap(event -> event.value(seq(Schema.location, Schema.url)))
        //         .optMap(Values::iri)
        //         .map(Value::stringValue)
        //         .distinct()
        //
        //         .optMap(new GET<>(new JSON()))
        //
        //         .map(JSONPath::new)
        //         .map(this::place)
        //
        //         .collect(toList());
        //
        // Xtream.from(
        //
        //                 validate(
        //                         Event(),
        //                         Set.of(Event),
        //                         events.stream(),
        //                         places.stream()
        //                 ),
        //
        //                 validate(
        //                         Schema.Location(),
        //                         Set.of(Schema.VirtualLocation, Schema.Place, Schema.PostalAddress),
        //                         places.stream()
        //                 )
        //
        //         )
        //
        //         .forEach(new Events.Updater(Context));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JsonValue> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://linkedevents-api.turku.fi/v1/event/"
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
        return Xtream.of(value).map(JSONPath::new).map(json -> {

            final String id=json.string("@id").orElseThrow();

            final Stream<Literal> shortDescription=json.entries("short_description")
                    .filter(entry -> Resources.Languages.contains(entry.getKey()))
                    .map(this::local)
                    .flatMap(Optional::stream)
                    .map(this::normalize);

            final Stream<Literal> fullDescription=json.entries("description")
                    .filter(entry -> Resources.Languages.contains(entry.getKey()))
                    .map(this::local)
                    .flatMap(Optional::stream)
                    .map(l -> normalize(l, s -> EOLPattern.matcher(s).replaceAll("\n\n")));

            return frame(iri(Events.Context, md5(id)))

                    .value(RDF.TYPE, Events.Event)

                    .value(Resources.university, Turku.Id)

                    .frame(DCTERMS.PUBLISHER, Publisher)
                    .value(DCTERMS.SOURCE, iri(id))

                    .value(DCTERMS.ISSUED, json.string("date_published").map(v -> literal(v, XSD.DATETIME)))
                    .value(DCTERMS.CREATED, json.string("created_time").map(v -> literal(v, XSD.DATETIME)))
                    .value(DCTERMS.MODIFIED, json.string("last_modified_time")
                            .map(v -> literal(v, XSD.DATETIME))
                            .orElseGet(() -> literal(now))
                    )

                    // !!! keywords

                    .values(Schema.url, json.entries("info_url")
                            .filter(entry -> Resources.Languages.contains(entry.getKey()))
                            .flatMap(entry -> entry.getValue().strings(""))
                            .map(Strings::normalize)
                            .map(Values::iri)
                    )

                    .values(Schema.name, label(json.entries("name")))
                    .values(Schema.image, json.strings("images.*.url").map(Values::iri))
                    .values(Schema.disambiguatingDescription, shortDescription)
                    .values(Schema.description, fullDescription)

                    .value(Schema.isAccessibleForFree, json.bools("offers.*.is_free")
                            .filter(v -> v)
                            .findFirst()
                            .map(Values::literal)
                    )

                    .value(Schema.eventStatus, json.string("event_status")
                            .filter(v -> stream(Schema.EventStatus.values()).map(Enum::name).anyMatch(v::equals))
                            .map(status -> iri(Schema.Namespace, status))
                    )

                    .frames(Schema.location, location(json))

                    .value(Schema.startDate, json.string("start_time").map(v -> literal(v, XSD.DATETIME)))
                    .value(Schema.endDate, json.string("end_time").map(v -> literal(v, XSD.DATETIME)))

                    // !!! in_language
                    // !!! audience

                    ;
        });
    }

    private Stream<Frame> location(final JSONPath json) {

        // !!! is_virtualevent // not populated as of 2022-07-25

        return json.string("location.@id")
                .map(Values::iri)
                .map(iri -> frame(item(Locations.Context, iri.stringValue()))
                        .value(RDF.TYPE, Schema.Place)
                        .value(Schema.url, iri)
                )
                .map(Stream::of)

                .or(() -> json.path("location_extra_info").map(location -> location.entries("")
                        .filter(entry -> Resources.Languages.contains(entry.getKey()))
                        .optMap(entry -> entry.getValue().string("")
                                .map(Strings::normalize)
                                .map(info -> frame(item(Locations.Context, info))
                                        .value(RDF.TYPE, Schema.Place)
                                        .value(Schema.name, literal(info, entry.getKey()))
                                )
                        )
                ))

                .orElseGet(Stream::empty);
    }

    private Frame place(final JSONPath json) {

        final String id=json.string("@id").orElseThrow();

        final Frame address=frame(iri())

                .values(Schema.addressCountry, label(json.entries("address_country")))
                .values(Schema.addressRegion, label(json.entries("address_region")))
                .values(Schema.addressLocality, label(json.entries("address_locality")))
                .values(Schema.postalCode, label(json.entries("postal_code")))
                .values(Schema.streetAddress, label(json.entries("street_address")))

                .values(Schema.url, label(json.entries("info_url")))
                .values(Schema.email, label(json.entries("email")))
                .values(Schema.telephone, label(json.entries("telephone")));

        return frame(item(Locations.Context, id))

                .value(RDF.TYPE, json.string("@type").map(Schema::term).orElse(Schema.Place))

                .value(Schema.url, iri(id))

                .values(Schema.name, label(json.entries("name")))
                .values(Schema.description, label(json.entries("description")))

                .frame(Schema.address, Optional.of(address)
                        .filter(not(Frame::isEmpty))
                        .map(frame -> frame

                                .value(RDF.TYPE, Schema.PostalAddress)

                                .refocus(item(Locations.Context, frame.skolemize( // !!! wildcard
                                        Schema.addressCountry,
                                        Schema.addressRegion,
                                        Schema.addressLocality,
                                        Schema.postalCode,
                                        Schema.streetAddress,
                                        Schema.url,
                                        Schema.email,
                                        Schema.telephone
                                ))))
                )

                .value(Schema.longitude, json.decimal("position.coordinates.0").map(Values::literal))
                .value(Schema.latitude, json.decimal("position.coordinates.1").map(Values::literal));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Literal> label(final Stream<Entry<String, JSONPath>> values) {
        return local(values).map(this::normalize);
    }


    private Stream<Literal> local(final Stream<Entry<String, JSONPath>> values) {
        return values
                .filter(entry -> Resources.Languages.contains(entry.getKey()))
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
