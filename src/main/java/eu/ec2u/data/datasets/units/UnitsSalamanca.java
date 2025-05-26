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

import com.metreeca.flow.Xtream;
import com.metreeca.flow.csv.formats.CSV;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.services.Vault;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.persons.PersonFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;
import org.apache.commons.csv.CSVFormat;

import java.net.URI;
import java.util.*;
import java.util.Map.Entry;
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
import static com.metreeca.shim.Strings.split;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.persons.Person.person;
import static eu.ec2u.data.datasets.taxonomies.TopicsEC2UOrganizations.*;
import static eu.ec2u.data.datasets.units.Unit.euroscivoc;
import static eu.ec2u.data.datasets.units.Unit.review;
import static eu.ec2u.data.datasets.units.Units.UNITS;
import static eu.ec2u.data.datasets.universities.University.SALAMANCA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.lang.String.format;
import static java.nio.charset.StandardCharsets.UTF_8;
import static java.util.Locale.ROOT;
import static java.util.function.Predicate.not;
import static java.util.function.UnaryOperator.identity;

public final class UnitsSalamanca implements Runnable {

    private static final String API_URL="units-salamanca-url"; // vault label
    private static final String API_KEY="units-salamanca-key"; // vault label

    private static final String VIS_URL="units-salamanca-vis-url"; // vault label


    public static void main(final String... args) {
        exec(() -> new UnitsSalamanca().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Vault vault=service(vault());
    private final Logger logger=service(logger());


    @Override public void run() {

        final List<Entry<URI, Unit>> vis=list(vis());

        service(store()).modify(

                array(list(units()
                        .map(json -> async(() -> unit(json, vis)))
                        .collect(joining())
                        .flatMap(identity())
                )),

                value(query(new UnitFrame(true))
                        .where("university", criterion().any(SALAMANCA))
                )
        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> units() {

        final String url=vault.get(API_URL);
        final String key=vault.get(API_KEY);

        return Xtream.of(url)

                .optMap(new GET<>(new JSON(), request -> request
                        .header("Authorization", format("Basic %s",
                                Base64.getEncoder().encodeToString(key.getBytes(UTF_8))
                        ))
                ))

                .flatMap(Value::values);
    }

    private Stream<? extends Valuable> unit(final Value json, final Collection<Entry<URI, Unit>> vis) {
        return json.get("id").string().stream().flatMap(id -> {

            final URI uri=UNITS.id().resolve(uuid(SALAMANCA, id));

            final Optional<PersonFrame> head=json.get("head").string()
                    .flatMap(p -> person(SALAMANCA, p));

            final Optional<UnitFrame> department=department(json);
            final Optional<UnitFrame> institute=institute(json);

            final Optional<UnitFrame> unitFrame=review(new UnitFrame()

                    .generated(true)

                    .id(uri)

                    .university(SALAMANCA)

                    .prefLabel(label(json).orElse(null))
                    .altLabel(acronym(json).orElse(null))
                    .definition(definition(json).orElse(null))

                    .classification(set(RECOGNIZED_GROUP))

                    .unitOf(set(concat(
                            department.isEmpty() && institute.isEmpty() ? Stream.of(SALAMANCA) : Stream.empty(),
                            department.stream(),
                            institute.stream(),
                            vis.stream()
                                    .filter(e -> e.getKey().equals(uri))
                                    .map(Entry::getValue)
                    )))

                    .hasHead(set(head.stream()))
                    .hasMember(set(head.stream()))

                    .homepage(set(homepage(json)))

                    .subject(set(Stream.concat(
                            branch(json),
                            RIS3(json)
                    )))

            );

            return concat(

                    unitFrame.stream(),

                    head.stream(),
                    department.stream(),
                    institute.stream()

            );

        });
    }


    private Optional<Map<Locale, String>> label(final Value json) {
        return json.get("name").string()
                .filter(not(String::isEmpty))
                .map(v -> map(entry(SALAMANCA.locale(), v)));
    }

    private Optional<Map<Locale, String>> acronym(final Value json) {
        return json.get("acronym").string()
                .filter(not(String::isEmpty))
                .map(v -> map(entry(ROOT, v)));
    }

    private Optional<Map<Locale, String>> definition(final Value json) {
        return json.get("topics").string()
                .filter(not(String::isEmpty))
                .map(v -> map(entry(SALAMANCA.locale(), v)));
    }

    private Stream<URI> homepage(final Value json) {
        return json.get("group_scientific_portal_url").string()
                .filter(not(String::isEmpty))
                .map(URIs::uri)
                .stream();
    }


    private Stream<Topic> branch(final Value json) {
        return json.get("knowledge_branch").string().stream()
                .flatMap(v -> split(v, "[,;]"))
                .flatMap(euroscivoc())
                .limit(1);
    }

    private Stream<Topic> RIS3(final Value json) {
        return json.get("RIS3").string().stream()
                .flatMap(v -> split(v, "[,;]"))
                .flatMap(euroscivoc())
                .limit(1);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<UnitFrame> department(final Value json) {
        return json.get("department").string().filter(not(String::isBlank)).flatMap(name -> review(new UnitFrame()

                .id(UNITS.id().resolve(uuid(SALAMANCA, name)))

                .university(SALAMANCA)
                .unitOf(set(SALAMANCA))

                .prefLabel(map(entry(SALAMANCA.locale(), name)))

                .classification(set(DEPARTMENT))

                .homepage(set(Xtream.from(
                        json.get("department_web_usal_url").string().flatMap(URIs::fuzzy).stream(),
                        json.get("department_scientific_portal_url").string().flatMap(URIs::fuzzy).stream()

                )))

        ));
    }

    private Optional<UnitFrame> institute(final Value json) {
        return json.get("institute").string().filter(not(String::isBlank)).flatMap(name -> review(new UnitFrame()

                .id(UNITS.id().resolve(uuid(SALAMANCA, name)))

                .university(SALAMANCA)
                .unitOf(set(SALAMANCA))

                .prefLabel(map(entry(SALAMANCA.locale(), name)))

                .classification(set(INSTITUTE))

                .homepage(set(Xtream.from(
                        json.get("institute_webusal_url").string().flatMap(URIs::fuzzy).stream(),
                        json.get("institute_scientific_portal_url").string().flatMap(URIs::fuzzy).stream()
                )))

        ));
    }

    private Stream<Entry<URI, Unit>> vis() {
        return Xtream.of(vault.get(VIS_URL))

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

                    final Optional<UnitFrame> vi=Unit.vi(e.getValue());

                    if ( vi.isEmpty() ) {
                        logger.warning(UnitsSalamanca.class, format(
                                "unknown VI <%s>", e.getValue()
                        ));
                    }

                    return entry(uri(e.getKey()), vi);

                })

                .filter(e -> e.getValue().isPresent())

                .map(e -> entry(e.getKey(), e.getValue().get()));
    }

}
