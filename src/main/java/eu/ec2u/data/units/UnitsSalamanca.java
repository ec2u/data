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
import com.metreeca.flow.csv.formats.CSV;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.mesh.util.URIs;

import eu.ec2u.data.persons.PersonFrame;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.EuroSciVoc;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.work.Parsers;
import org.apache.commons.csv.CSVFormat;

import java.net.URI;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.flow.services.Vault.vault;
import static com.metreeca.flow.toolkits.Strings.split;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.persons.Person.person;
import static eu.ec2u.data.taxonomies.EC2UOrganizations.*;
import static eu.ec2u.data.units.Unit.review;
import static eu.ec2u.data.units.Units.SUBJECT_THRESHOLD;
import static eu.ec2u.data.universities.University.SALAMANCA;
import static eu.ec2u.data.universities.University.uuid;
import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;

public final class UnitsSalamanca implements Runnable {

    private static final URI CONTEXT=Units.UNITS.id().resolve("salamanca");

    private static final String API_URL="units-salamanca-url"; // vault label
    private static final String API_KEY="units-salamanca-key"; // vault label

    private static final String VIS_URL="units-salamanca-vis-url";


    public static void main(final String... args) {
        exec(() -> new UnitsSalamanca().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Logger logger=service(logger());


    private final Collection<Entry<URI, Unit>> vis=Xtream.of(vault.get(VIS_URL))

            .optMap(new GET<>(new CSV(CSVFormat.Builder.create()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .build()
            )))

            .flatMap(Collection::stream)

            .map(record -> entry(
                    record.get("Work"),
                    record.get("VI") // !!! Unit
            ))

            .filter(e -> !e.getKey().isEmpty())
            .filter(e -> !e.getValue().isEmpty())

            .map(e -> {

                final Optional<Unit> vi=Unit.vi(e.getValue());

                if ( vi.isEmpty() ) {
                    logger.warning(UnitsSalamanca.class, format(
                            "unknown VI <%s>", e.getValue()
                    ));
                }

                return entry(uri(e.getKey()), vi);

            })

            .filter(e -> e.getValue().isPresent())

            .map(e -> entry(e.getKey(), e.getValue().get()))

            .toList();


    @Override public void run() {
        service(store()).modify(

                array(list(Stream.of(Instant.EPOCH)
                .flatMap(this::units)
                .flatMap(this::unit)
                )),

                value(query(new UnitFrame(true)).where("university", criterion().any(SALAMANCA)))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> units(final Instant updated) {

        final String url=vault.get(API_URL);
        final String key=vault.get(API_KEY);

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

                .generated(true)

                .id(Units.UNITS.id().resolve(uuid(SALAMANCA, id)))

                .university(SALAMANCA)

                .prefLabel(json.get("name").string()
                        .filter(not(String::isEmpty))
                        .map(v -> map(entry(SALAMANCA.locale(), v)))
                        .orElse(null)
                )

                .altLabel(json.get("acronym").string()
                        .filter(not(String::isEmpty))
                        .map(v -> map(entry(ROOT, v)))
                        .orElse(null)
                )

                .definition(json.get("topics").string()
                        .filter(not(String::isEmpty))
                        .map(v -> map(entry(SALAMANCA.locale(), v)))
                        .orElse(null)
                )

                .classification(set(RECOGNIZED_GROUP))

                .unitOf(set(SALAMANCA))

                .homepage(set(json.get("group_scientific_portal_url").string()
                        .filter(not(String::isEmpty))
                        .map(URIs::uri)
                        .stream()
                ))

                .subject(set(Stream.concat(

                        json.get("knowledge_branch").string().stream()
                                .flatMap(v -> split(v, "[,;]"))
                                .flatMap(topic -> Resources.match(EuroSciVoc.EUROSCIVOC.id(), topic, SUBJECT_THRESHOLD).findFirst().stream())
                                .map(uri -> new TopicFrame(true).id(uri)),

                        json.get("RIS3").string().stream()
                                .flatMap(v -> split(v, "[,;]"))
                                .flatMap(topic -> Resources.match(EuroSciVoc.EUROSCIVOC.id(), topic, SUBJECT_THRESHOLD).findFirst().stream())
                                .map(uri -> new TopicFrame(true).id(uri))

                )))

        ).flatMap(unit -> review(unit, SALAMANCA.locale())).stream().flatMap(unit -> {

            final Optional<PersonFrame> head=json.get("head").string()
                    .flatMap(p -> person(p, SALAMANCA))
                    .map(p -> p.headOf(set(unit)).memberOf(set(unit)));

            final Optional<UnitFrame> department=department(json);
            final Optional<UnitFrame> institute=institute(json);

            return Xtream.from(
                    Stream.of(unit.unitOf(set(Xtream.from(
                            department.isEmpty() && institute.isEmpty() ? Stream.of(SALAMANCA) : Stream.empty(),
                            department.stream(),
                            institute.stream(),
                            vis.stream()
                                    .filter(e -> e.getKey().equals(unit.id()))
                                    .map(Entry::getValue)
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

                .id(Units.UNITS.id().resolve(uuid(SALAMANCA, name)))

                .university(SALAMANCA)
                .unitOf(set(SALAMANCA))

                .prefLabel(map(entry(SALAMANCA.locale(), name)))

                .classification(set(DEPARTMENT))

                .homepage(set(Xtream.from(
                        json.get("department_web_usal_url").string().flatMap(Parsers::uri).stream(),
                        json.get("department_scientific_portal_url").string().flatMap(Parsers::uri).stream()

                )))

        ).flatMap(unit -> review(unit, SALAMANCA.locale()));
    }

    private Optional<UnitFrame> institute(final Value json) {
        return json.get("institute").string().filter(not(String::isBlank)).map(name -> new UnitFrame()

                .id(Units.UNITS.id().resolve(uuid(SALAMANCA, name)))

                .university(SALAMANCA)
                .unitOf(set(SALAMANCA))

                .prefLabel(map(entry(SALAMANCA.locale(), name)))

                .classification(set(INSTITUTE))

                .homepage(set(Xtream.from(
                        json.get("institute_webusal_url").string().flatMap(Parsers::uri).stream(),
                        json.get("institute_scientific_portal_url").string().flatMap(Parsers::uri).stream()
                )))

        ).flatMap(unit -> review(unit, SALAMANCA.locale()));
    }

}
