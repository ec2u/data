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

package eu.ec2u.data.datasets.units;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.shim.Collections;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.persons.PersonFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;

import java.net.URI;
import java.util.Locale;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Streams.concat;
import static com.metreeca.shim.Streams.optional;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.Localized.PT;
import static eu.ec2u.data.datasets.persons.Person.person;
import static eu.ec2u.data.datasets.units.Unit.review;
import static eu.ec2u.data.datasets.universities.University.COIMBRA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;
import static java.util.function.UnaryOperator.identity;

public final class UnitsCoimbra implements Runnable {

    private static final String API_URL="units-coimbra-url";
    private static final String API_KEY="units-coimbra-key";


    public static void main(final String... args) {
        exec(() -> new UnitsCoimbra().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        service(store()).modify(

                array(list(units()
                        .map(json -> async(() -> unit(json)))
                        .collect(joining())
                        .flatMap(identity())
                )),

                value(query(new UnitFrame(true)).where("university", criterion().any(COIMBRA)))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> units() {

        final String url=vault.get(API_URL);
        final String key=service(vault()).get(API_KEY);

        return Stream.of(url)

                .flatMap(optional(new GET<>(new JSON(), request -> request
                        .header("Key", key)
                )))

                .filter(json -> json.get("error").string()

                        .map(message -> {

                            logger.error(this, json.toString());

                            return message;

                        })

                        .isEmpty()
                )

                .flatMap(Value::values);
    }

    private Stream<? extends Valuable> unit(final Value json) {
        return json.get("id").string().stream().flatMap(id -> {

            final Optional<PersonFrame> head=head(json);

            return concat(

                    review(new UnitFrame()

                            .generated(true)

                            .id(Units.UNITS.id().resolve(uuid(COIMBRA, id)))
                            .university(COIMBRA)

                            .homepage(set(homepage(json)))
                            .mbox(set(mbox(json)))

                            .identifier(id)

                            .altLabel(map(altLabel(json)))
                            .prefLabel(map(prefLabel(json)))
                            .definition(map(definition(json)))

                            .unitOf(set(COIMBRA))

                            .hasHead(head.map(Collections::set).orElse(null))
                            .hasMember(head.map(Collections::set).orElse(null))

                            .classification(set(classification(json).stream()))

                            .subject(set(Stream.concat(
                                    sector(json).stream(),
                                    subjects(json)
                            )))
                    ),

                    head

            );

        });
    }


    private Stream<URI> homepage(final Value json) {
        return json.get("web_url").string().flatMap(URIs::fuzzy).stream();
    }

    private Stream<String> mbox(final Value json) {
        return json.get("email").string().flatMap(Reference::email).stream();
    }

    private Stream<Entry<Locale, String>> altLabel(final Value json) {
        return json.get("acronym_en").string()
                .filter(not(String::isEmpty))
                .map(v -> entry(ROOT, v))
                .stream();
    }

    private Stream<Entry<Locale, String>> prefLabel(final Value json) {
        return Stream.concat(

                json.get("name_en").string()
                        .filter(not(String::isEmpty))
                        .map(v -> entry(EN, v))
                        .stream(),

                json.get("name_pt").string()
                        .filter(not(String::isEmpty))
                        .map(v -> entry(PT, v))
                        .stream()

        );
    }

    private Stream<Entry<Locale, String>> definition(final Value json) {
        return Stream.concat(

                json.get("description_en").string()
                        .filter(not(String::isEmpty))
                        .map(v -> entry(EN, v))
                        .stream(),

                json.get("description_pt").string()
                        .filter(not(String::isEmpty))
                        .map(v -> entry(PT, v))
                        .stream()

        );
    }

    private Optional<Topic> classification(final Value json) {
        return json.get("type_en").string().stream()
                .flatMap(Unit.organizations())
                .findFirst();
    }

    private Optional<PersonFrame> head(final Value json) {
        return json.get("surname").string().flatMap(surname ->
                json.get("forename").string().flatMap(forename ->
                        person(COIMBRA, forename, surname)
                )
        );
    }

    private Optional<Topic> sector(final Value json) {
        return json.get("knowledge_branch_en").string()
                .or(() -> json.get("knowledge_branch_pt").string())
                .stream()
                .flatMap(Unit.euroscivoc())
                .findFirst();
    }

    private Stream<Topic> subjects(final Value json) {
        return json.select("topics.*.name_en").strings()
                .flatMap(Unit.euroscivoc());
    }

}
