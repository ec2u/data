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

import eu.ec2u.data.cities.Coimbra;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.Schema;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.*;
import java.util.Optional;
import java.util.regex.Pattern;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Strings.clip;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.iri;
import static com.metreeca.link.Values.literal;

import static eu.ec2u.data.ports.Events.Event;
import static eu.ec2u.data.tasks.Tasks.*;
import static eu.ec2u.data.tasks.events.Events.synced;

import static java.lang.String.format;
import static java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME;

public final class EventsCoimbraCity implements Runnable {

    private static final Frame Publisher=frame(iri("https://www.coimbragenda.pt/"))
            .value(RDF.TYPE, EC2U.Publisher)
            .value(DCTERMS.COVERAGE, EC2U.City)
            .values(RDFS.LABEL,
                    literal("Coimbra City Council / CoimbrAgenda", "en"),
                    literal("Câmara Municipal de Coimbra / CoimbrAgenda", Coimbra.Language)
            );

    private static final Pattern FreePattern=Pattern.compile("(?i)\\blivre\\b");


    public static void main(final String... args) {
        exec(() -> new EventsCoimbraCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream.of(synced(Publisher.focus()))

                .flatMap(this::crawl)
                .optMap(this::event)

                .sink(events -> upload(EC2U.events,
                        validate(Event(), EC2U.Event, events)
                ));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> crawl(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<Instant>()
                        .model("https://www.coimbragenda.pt/api/v1/event/filter"
                                +"?limit=1000" // ;-) avoid pagination (usually some 50 events returned)
                                +"&page=1"
                        )
                )

                .optMap(new GET<>(new JSON()))

                .map(JSONPath::new)
                .flatMap(json -> json.paths("data.docs.*"));
    }

    private Optional<Frame> event(final JSONPath json) {
        return json.string("categories.*._id")

                .flatMap(category -> json.string("_id")
                        .map(id -> format("https://www.coimbragenda.pt/#!/category/%s/event/%s", category, id))
                )

                .map(url -> {

                    final Optional<Literal> name=json
                            .string("languageObjects.*.title")
                            .map(title -> json
                                    .string("languageObjects.*.subtitle")
                                    .map(subtitle -> format("%s - %s", title, subtitle))
                                    .orElse(title)
                            )
                            .map(text -> literal(text, Coimbra.Language));

                    final Optional<Literal> description=json
                            .string("languageObjects.*.description")
                            .map(text -> literal(text, Coimbra.Language));

                    final Optional<Literal> disambiguatingDescription=description
                            .map(literal -> literal(clip(literal.stringValue()), Coimbra.Language));

                    return frame(iri(EC2U.events, md5(url)))

                            .values(RDF.TYPE, Schema.Event)

                            .frames(DCTERMS.SUBJECT, subjects(json))

                            .value(DCTERMS.SOURCE, iri(url))
                            .frame(DCTERMS.PUBLISHER, Publisher)
                            .value(DCTERMS.CREATED, json.string("createdAt").map(this::timestamp))
                            .value(DCTERMS.MODIFIED, json.string("updatedAt").map(this::timestamp))

                            .value(EC2U.university, Coimbra.University)

                            .value(Schema.url, iri(url))
                            .value(Schema.name, name)
                            .value(Schema.image, json.string("profileImage._id")
                                    .map(image -> iri(format("https://www.coimbragenda.pt/api/v1/file/%s", image)))
                            )
                            .value(Schema.description, description)
                            .value(Schema.disambiguatingDescription, disambiguatingDescription)

                            .value(Schema.startDate, datetime(json, "startDate", "startHour"))
                            .value(Schema.endDate, datetime(json, "endDate", "endHour"))

                            .value(Schema.isAccessibleForFree, json.string("languageObjects.*.priceList")
                                    .filter(s -> FreePattern.matcher(s).find())
                                    .map(v -> literal(true))
                            )

                            .frame(Schema.location, location(json));

                });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Literal timestamp(final String date) {
        return literal(OffsetDateTime.parse(date, ISO_OFFSET_DATE_TIME));
    }

    private Optional<Literal> datetime(final JSONPath json, final String date, final String hour) {
        return json.string(date)
                .map(OffsetDateTime::parse)
                .map(OffsetDateTime::toLocalDate)
                .flatMap(_date -> json.integer(hour)
                        .map(integer -> LocalTime.of(integer.intValue()/60, 0))
                        .map(time -> LocalDateTime.of(_date, time).atZone(Coimbra.Zone))
                )
                .map(Values::literal);
    }

    private Xtream<Frame> subjects(final JSONPath json) {
        return Xtream.from(json.paths("categories.*")).optMap(category -> category.string("_id").map(id -> {

            final Optional<Literal> label=category.string("codename")
                    .map(text -> literal(text, Coimbra.Language));

            return frame(iri(EC2U.concepts, md5(id)))
                    .value(RDF.TYPE, SKOS.CONCEPT)
                    .value(RDFS.LABEL, label)
                    .value(SKOS.PREF_LABEL, label);

        }));
    }

    private Optional<Frame> location(final JSONPath json) {
        return json.string("place.name").map(name -> frame(iri(EC2U.locations, md5(name)))
                .value(Schema.name, literal(name, Coimbra.Language))
                .value(Schema.longitude, json.decimal("place.longitude").map(Values::literal))
                .value(Schema.latitude, json.decimal("place.latitude").map(Values::literal))
        );
    }

}
