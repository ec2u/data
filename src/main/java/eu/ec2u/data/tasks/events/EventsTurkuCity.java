/*
 * Copyright © 2020-2022 EC2U Alliance
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

import com.metreeca.core.Strings;
import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.xml.actions.Untag;

import eu.ec2u.data.cities.Turku;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.util.*;
import java.util.Map.Entry;
import java.util.function.UnaryOperator;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import javax.json.JsonValue;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Lambdas.task;
import static com.metreeca.http.Locator.service;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;
import static com.metreeca.link.shifts.Seq.seq;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.*;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.time.ZoneOffset.UTC;
import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE;
import static java.util.Arrays.stream;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toList;

public final class EventsTurkuCity implements Runnable {

    private static final Pattern EOLPattern=Pattern.compile("\n+");

    private static final Frame Publisher=frame(iri("https://kalenteri.turku.fi/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("City of Turku / Event's Calendar", "en"),
                    literal("Turun kaupunki / Tapahtumakalenteri", Turku.Language)
            );


    public static void main(final String... args) {
        exec(() -> new EventsTurkuCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final ZonedDateTime now=ZonedDateTime.now(UTC);


    @Override public void run() {

        final List<Frame> events=Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .flatMap(this::event)

                .collect(toList());

        final List<Frame> locations=Xtream.from(events)

                .optMap(event -> event.value(seq(Schema.location, Schema.url)))
                .optMap(Values::iri)
                .map(Value::stringValue)
                .distinct()

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .map(this::location)

                .collect(toList());

        service(graph()).update(task(connection -> {

            upload(EC2U.events, validate(
                    Event(),
                    Set.of(EC2U.Event),
                    events.stream(),
                    locations.stream()
            ));

            upload(EC2U.locations, validate(
                    Schema.Location(),
                    Set.of(Schema.VirtualLocation, Schema.Place, Schema.PostalAddress),
                    locations.stream()
            ));

        }));

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
                    .filter(entry -> EC2U.Languages.contains(entry.getKey()))
                    .map(this::local)
                    .flatMap(Optional::stream)
                    .map(this::normalize);

            final Stream<Literal> fullDescription=json.entries("description")
                    .filter(entry -> EC2U.Languages.contains(entry.getKey()))
                    .map(this::local)
                    .flatMap(Optional::stream)
                    .map(l -> normalize(l, s -> EOLPattern.matcher(s).replaceAll("\n\n")));

            return frame(iri(EC2U.events, md5(id)))

                    .value(RDF.TYPE, EC2U.Event)

                    .value(EC2U.university, Turku.University)

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

                    // !!! is_virtualevent

                    .frame(Schema.location, json.string("location.@id").map(Values::iri).map(iri ->
                            frame(iri(EC2U.locations, md5(iri.stringValue()))).value(Schema.url, iri)
                    ))

                    // !!! location_extra_info

                    .value(Schema.startDate, json.string("start_time").map(v -> literal(v, XSD.DATETIME)))
                    .value(Schema.endDate, json.string("end_time").map(v -> literal(v, XSD.DATETIME)))

                    // !!! in_language
                    // !!! audience

                    ;
        });
    }

    private Frame location(final JSONPath json) {

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

        return frame(iri(EC2U.locations, md5(id)))

                .value(RDF.TYPE, json.string("@type").map(Schema::term).orElse(Schema.Place))

                .value(Schema.url, iri(id))

                .values(Schema.name, label(json.entries("name")))
                .values(Schema.description, label(json.entries("description")))

                .frame(Schema.address, Optional.of(address)
                        .filter(not(Frame::isEmpty))
                        .map(frame -> frame

                                .value(RDF.TYPE, Schema.PostalAddress)

                                .refocus(iri(EC2U.locations, frame.skolemize( // !!! wildcard
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
                .filter(entry -> EC2U.Languages.contains(entry.getKey()))
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
