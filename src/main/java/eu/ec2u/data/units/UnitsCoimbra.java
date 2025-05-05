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

package eu.ec2u.data.units;

import com.metreeca.flow.actions.Fill;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.util.Collections;
import com.metreeca.mesh.util.URIs;

import eu.ec2u.data.persons.Person;
import eu.ec2u.data.persons.PersonFrame;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.EC2UOrganizations;
import eu.ec2u.data.taxonomies.EuroSciVoc;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.work.Parsers;

import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.resources.Localized.EN;
import static eu.ec2u.data.resources.Localized.PT;
import static eu.ec2u.data.units.Unit.review;
import static eu.ec2u.data.units.Units.SUBJECT_THRESHOLD;
import static eu.ec2u.data.universities.University.COIMBRA;
import static eu.ec2u.data.universities.University.uuid;
import static java.lang.String.join;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

public final class UnitsCoimbra implements Runnable {

    private static final String APIUrl="units-coimbra-url";
    private static final String APIKey="units-coimbra-key";


    public static void main(final String... args) {
        exec(() -> new UnitsCoimbra().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        service(store()).modify(

                array(list(Xtream.of(Instant.EPOCH)
                        .flatMap(this::units)
                        .flatMap(this::unit)
                )),

                value(query(new UnitFrame(true)).where("university", criterion().any(COIMBRA)))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Value> units(final Instant updated) {

        final String url=vault.get(APIUrl);
        final String key=service(vault()).get(APIKey);

        return Xtream.of(updated)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON(), request -> request
                        .header("Key", key)
                ))

                .filter(json -> json.get("error").string()

                        .map(message -> {

                            logger.error(this, json.toString());

                            return message;

                        })

                        .isEmpty())

                .flatMap(Value::values);
    }

    private Stream<? extends Valuable> unit(final Value json) {
        return json.get("id").string().map(id -> new UnitFrame()

                .generated(true)

                .id(Units.UNITS.id().resolve(uuid(COIMBRA, id)))
                .university(COIMBRA)

                .homepage(set(json.get("web_url").string().flatMap(Parsers::url).map(URIs::uri).stream()))
                .mbox(set(json.get("email").string().flatMap(Parsers::email).stream()))

                .identifier(id)

                .altLabel(map(json.get("acronym_en").string()
                        .filter(not(String::isEmpty))
                        .map(v -> entry(ROOT, v))
                        .stream()
                ))

                .prefLabel(map(Stream.concat(

                        json.get("name_en").string()
                                .filter(not(String::isEmpty))
                                .map(v -> entry(EN, v))
                                .stream(),

                        json.get("name_pt").string()
                                .filter(not(String::isEmpty))
                                .map(v -> entry(PT, v))
                                .stream()

                )))

                .definition(map(Stream.concat(

                        json.get("description_en").string()
                                .filter(not(String::isEmpty))
                                .map(v -> entry(EN, v))
                                .stream(),

                        json.get("description_pt").string()
                                .filter(not(String::isEmpty))
                                .map(v -> entry(PT, v))
                                .stream()

                )))

                .unitOf(set(COIMBRA))

                .classification(set(json.get("type_en").string()
                        .flatMap(type -> Resources.match(EC2UOrganizations.EC2U_ORGANIZATIONS.id(), type))
                        .map(uri -> new TopicFrame(true).id(uri))
                        .stream()
                ))

                .subject(set(Stream.concat(
                        sector(json).stream(), // !!! review property
                        subjects(json)
                )))

        ).flatMap(unit ->

                review(unit, COIMBRA.locale()) // !!! review after setting linked objects

        ).stream().flatMap(unit -> {

            final Optional<PersonFrame> head=head(json);

            return Xtream.from(

                    Stream.of(unit
                            .hasHead(head.map(Collections::set).orElse(null))
                            .hasMember(head.map(Collections::set).orElse(null))
                    ),

                    head.stream()

            );

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<PersonFrame> head(final Value json) {
        return json.get("surname").string()
                .flatMap(surname ->
                        json.get("forename").string().map(forename -> new PersonFrame() // !!! factor

                                .id(Persons.PERSONS.id().resolve(uuid(COIMBRA, join(", ", surname, forename))))
                                .university(COIMBRA)
                                .collection(Persons.PERSONS)

                                .givenName(forename)
                                .familyName(surname)

                        )
                )
                .flatMap(Person::review);
    }

    private Optional<Topic> sector(final Value json) {
        return json.get("knowledge_branch_en").string()
                .or(() -> json.get("knowledge_branch_pt").string())
                .flatMap(topic -> Resources.match(EuroSciVoc.EUROSCIVOC.id(), topic, SUBJECT_THRESHOLD).findFirst())
                .map(uri -> new TopicFrame(true).id(uri));
    }

    private Stream<Topic> subjects(final Value json) {
        return json.select("topics.*.name_en").strings()
                .flatMap(topic -> Resources.match(EuroSciVoc.EUROSCIVOC.id(), topic, SUBJECT_THRESHOLD))
                .map(uri -> new TopicFrame(true).id(uri));
    }

}
