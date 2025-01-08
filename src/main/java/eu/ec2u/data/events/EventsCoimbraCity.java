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

import com.metreeca.http.actions.Fill;
import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.formats.JSON;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.Data;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.things.Locations;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static com.metreeca.http.toolkits.Strings.clip;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.events.Events.*;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.universities.University.Coimbra;
import static java.lang.String.format;

public final class EventsCoimbraCity implements Runnable {

    private static final IRI Context=iri(Events.Context, "/coimbra/city");

    private static final Frame Publisher=frame(

            field(ID, iri("https://www.coimbragenda.pt/")),
            field(TYPE, Schema.Organization),

            field(university, Coimbra.id),

            field(Schema.name,
                    literal("Coimbra City Council / CoimbrAgenda", "en"),
                    literal("Câmara Municipal de Coimbra / CoimbrAgenda", Coimbra.language)
            ),

            field(Schema.about, OrganizationTypes.City)

    );


    private static final Pattern FreePattern=Pattern.compile("(?i)\\blivre\\b");


    public static void main(final String... args) {
        Data.exec(() -> new EventsCoimbraCity().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {
        update(connection -> Xtream.of(Instant.now())

                .flatMap(this::crawl)
                .optMap(this::event)

                .filter(frame -> frame.value(startDate).isPresent())

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Events_.Loader(Context))

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<JSONPath> crawl(final Instant now) {
        return Xtream.of(now)

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
                            .map(text -> literal(text, Coimbra.language));

                    final Optional<Literal> description=json
                            .string("languageObjects.*.description")
                            .map(text -> literal(text, Coimbra.language));

                    final Optional<Literal> disambiguatingDescription=description
                            .map(literal -> literal(clip(literal.stringValue()), Coimbra.language));

                    return frame(

                            field(ID, item(Events.Context, url)),

                            field(RDF.TYPE, Event),

                            field(university, Coimbra.id),

                            field(Schema.url, iri(url)),
                            field(Schema.name, name),

                            field(Schema.image, json.string("profileImage._id")
                                    .map(image -> iri(format("https://www.coimbragenda.pt/api/v1/file/%s", image)))
                                    .map(iri -> frame(
                                            field(ID, iri),
                                            field(TYPE, Schema.ImageObject),
                                            field(Schema.url, iri)
                                    ))
                            ),

                            field(Schema.description, description),
                            field(Schema.disambiguatingDescription, disambiguatingDescription),

                            field(startDate, datetime(json, "startDate", "startHour")),
                            field(endDate, datetime(json, "endDate", "endHour")),

                            field(Schema.isAccessibleForFree, json.string("languageObjects.*.priceList")
                                    .map(s -> FreePattern.matcher(s).find())
                                    .map(v -> literal(true))
                            ),

                            field(Schema.about, topics(json)),

                            field(publisher, Publisher),
                            field(Schema.location, location(json))

                    );

                });
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Literal> datetime(final JSONPath json, final String date, final String hour) {
        return json.string(date)
                .map(OffsetDateTime::parse)
                .map(OffsetDateTime::toLocalDate)
                .flatMap(_date -> json.integer(hour)
                        .map(integer -> LocalTime.of(integer.intValue()/60, 0))
                        .map(time -> LocalDateTime.of(_date, time).atZone(Coimbra.zone))
                )
                .map(Frame::literal);
    }

    private Stream<Frame> topics(final JSONPath json) {
        return Xtream.from(json.paths("categories.*")).optMap(category -> category.string("_id").map(id -> {

            final Optional<Literal> label=category.string("codename")
                    .map(text -> literal(text, Coimbra.language));

            return frame(

                    field(ID, item(Topics, id)),

                    field(RDF.TYPE, SKOS.CONCEPT),
                    field(SKOS.TOP_CONCEPT_OF, Topics),
                    field(SKOS.PREF_LABEL, label)

            );

        }));
    }

    private Optional<Frame> location(final JSONPath json) {
        return json.string("place.name").map(name -> frame(

                field(ID, iri()),

                field(Schema.Place, frame(

                        field(ID, item(Locations.Context, name)),
                        field(TYPE, Schema.Place),

                        field(Schema.name, literal(name, Coimbra.language)),
                        field(Schema.longitude, json.decimal("place.longitude").map(Frame::literal)),
                        field(Schema.latitude, json.decimal("place.latitude").map(Frame::literal))

                ))

        ));
    }

}
