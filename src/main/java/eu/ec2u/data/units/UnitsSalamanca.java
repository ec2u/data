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
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.util.URIs;

import eu.ec2u.data.persons.PersonFrame;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.TopicFrame;

import java.net.URI;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.flow.toolkits.Strings.split;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.persons.Person.person;
import static eu.ec2u.data.taxonomies.EuroSciVoc.EUROSCIVOC;
import static eu.ec2u.data.taxonomies.OrganizationTypes.*;
import static eu.ec2u.data.units.Unit.review;
import static eu.ec2u.data.units.Units.SUBJECT_THRESHOLD;
import static eu.ec2u.data.units.Units.UNITS;
import static eu.ec2u.data.universities.University.Salamanca;
import static eu.ec2u.data.universities.University.uuid;
import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

public final class UnitsSalamanca implements Runnable {

    private static final URI CONTEXT=UNITS.resolve("salamanca");

    private static final String APIUrl="units-salamanca-url"; // vault label
    private static final String APIKey="units-salamanca-key"; // vault label


    public static void main(final String... args) {
        exec(() -> new UnitsSalamanca().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());


    @Override public void run() {
        service(store()).partition(CONTEXT).update(array(list(Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .flatMap(this::unit)

        )), FORCE);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> units(final Instant updated) {

        final String url=vault.get(APIUrl);
        final String key=service(vault()).get(APIKey);

        return Xtream.of(updated)

                .flatMap(new Fill<>()
                        .model(url)
                )

                .optMap(new GET<>(new JSON(), request -> request
                        .header("Authorization", format("Basic %s",
                                Base64.getEncoder().encodeToString(key.getBytes(UTF_8))
                        ))
                ))

                .flatMap(Value::values);
    }

    private Stream<? extends Valuable> unit(final Value json) {
        return json.get("id").string().map(id -> new UnitFrame()

                .id(UNITS.resolve(uuid(Salamanca(), id)))

                .university(Salamanca())

                .prefLabel(json.get("name").string()
                        .filter(not(String::isEmpty))
                        .map(v -> map(entry(Salamanca().locale(), v)))
                        .orElse(null)
                )

                .altLabel(json.get("acronym").string()
                        .filter(not(String::isEmpty))
                        .map(v -> map(entry(ROOT, v)))
                        .orElse(null)
                )

                .definition(json.get("topics").string()
                        .filter(not(String::isEmpty))
                        .map(v -> map(entry(Salamanca().locale(), v)))
                        .orElse(null)
                )

                .classification(set(RECOGNIZED_GROUP))

                .unitOf(set(Salamanca()))

                .homepage(set(json.get("group_scientific_portal_url").string()
                        .filter(not(String::isEmpty))
                        .map(URIs::uri)
                        .stream()
                ))

                .subject(set(Stream.concat(

                        json.get("knowledge_branch").string().stream()
                                .flatMap(v -> split(v, "[,;]"))
                                .flatMap(topic -> Resources.match(EUROSCIVOC, topic, SUBJECT_THRESHOLD).findFirst().stream())
                                .map(uri -> new TopicFrame(true).id(uri)),

                        json.get("RIS3").string().stream()
                                .flatMap(v -> split(v, "[,;]"))
                                .flatMap(topic -> Resources.match(EUROSCIVOC, topic, SUBJECT_THRESHOLD).findFirst().stream())
                                .map(uri -> new TopicFrame(true).id(uri))

                )))

        ).flatMap(u -> review(u, Salamanca().locale())).stream().flatMap(u -> {

            final Optional<PersonFrame> head=json.get("head").string()
                    .flatMap(p -> person(p, Salamanca()))
                    .map(p -> p.headOf(set(u)).memberOf(set(u)));

            final Optional<UnitFrame> department=department(json);
            final Optional<UnitFrame> institute=institute(json);

            return Xtream.from(
                    Stream.of(u.unitOf(set(Xtream.from(
                            department.isEmpty() && institute.isEmpty() ? Stream.of(Salamanca()) : Stream.empty(),
                            department.stream(),
                            institute.stream()
                            // !!! VIs
                    )))),
                    head.stream(),
                    department.stream(),
                    institute.stream()
            );

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<UnitFrame> department(final Value json) {
        return json.get("department").string().filter(not(String::isBlank)).map(name -> new UnitFrame()

                .id(UNITS.resolve(uuid(Salamanca(), name)))

                .university(Salamanca())
                .unitOf(set(Salamanca()))

                .prefLabel(map(entry(Salamanca().locale(), name)))

                .classification(set(DEPARTMENT))

                .homepage(set(Xtream.from(
                        json.get("department_web_usal_url").string().filter(not(String::isBlank)).map(URIs::uri).stream(),
                        json.get("department_scientific_portal_url").string().filter(not(String::isBlank)).map(URIs::uri).stream()

                )))
        ).flatMap(u -> review(u, Salamanca().locale()));
    }

    private Optional<UnitFrame> institute(final Value json) {
        return json.get("institute").string().filter(not(String::isBlank)).map(name -> new UnitFrame()

                .id(UNITS.resolve(uuid(Salamanca(), name)))

                .university(Salamanca())
                .unitOf(set(Salamanca()))

                .prefLabel(map(entry(Salamanca().locale(), name)))

                .classification(set(INSTITUTE))

                .homepage(set(Xtream.from(
                        json.get("institute_webusal_url").string().filter(not(String::isBlank)).map(URIs::uri).stream(),
                        json.get("institute_scientific_portal_url").string().filter(not(String::isBlank)).map(URIs::uri).stream()
                )))

        ).flatMap(u -> review(u, Salamanca().locale()));
    }

}
