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

import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.json.JSONPath;
import com.metreeca.json.codecs.JSON;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;

import eu.ec2u.data.cities.Turku;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import eu.ec2u.data.work.Work;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.util.*;
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
import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toSet;

public final class EventsTurkuCity implements Runnable {

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

            upload(EC2U.events,
                    validate(Event(), EC2U.Event, events.stream())
            );

            upload(EC2U.locations,
                    validate(Schema.Location(), Set.of(
                            Schema.VirtualLocation, Schema.Place, Schema.PostalAddress
                    ), locations.stream())
            );

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

            final Collection<Literal> name=local(json.entries("name"));

            final Collection<Literal> description=json.entries("short_description")
                    .filter(entry -> EC2U.Languages.contains(entry.getKey()))
                    .map(this::local)
                    .flatMap(Optional::stream)
                    .map(Work::untag)
                    .map(Work::normalize)
                    .collect(toSet());

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

                    .value(Schema.url, json.string("info_url").map(Values::iri))

                    .values(Schema.name, name)
                    .values(Schema.image, json.strings("images.*.url").map(Values::iri))
                    .values(Schema.disambiguatingDescription, description)
                    .values(Schema.description, local(json.entries("description")))

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

        return frame(iri(EC2U.locations, md5(id)))

                .value(RDF.TYPE, json.string("@type").map(Schema::term).orElse(Schema.Place))

                .value(Schema.url, iri(id))

                .values(Schema.name, local(json.entries("name")))
                .values(Schema.description, local(json.entries("description")))

                .frame(Schema.address, frame(iri())
                        .values(Schema.addressCountry, local(json.entries("address_country")))
                        .values(Schema.addressRegion, local(json.entries("address_region")))
                        .values(Schema.addressLocality, local(json.entries("address_locality")))
                        .values(Schema.postalCode, local(json.entries("postal_code")))
                        .values(Schema.streetAddress, local(json.entries("street_address")))
                )

                .value(Schema.longitude, json.decimal("position.coordinates.0").map(Values::literal))
                .value(Schema.latitude, json.decimal("position.coordinates.1").map(Values::literal));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Set<Literal> local(final Stream<Map.Entry<String, JSONPath>> values) {
        return values
                .filter(entry -> EC2U.Languages.contains(entry.getKey()))
                .map(this::local)
                .flatMap(Optional::stream)
                .map(Work::normalize)
                .collect(toSet());
    }

    private Optional<Literal> local(final Map.Entry<String, JSONPath> entry) {
        return entry.getValue().string("").map(text -> literal(text, entry.getKey()));
    }

}
