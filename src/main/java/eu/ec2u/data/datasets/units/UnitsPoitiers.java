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
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;

import eu.ec2u.data.datasets.persons.Person;
import eu.ec2u.data.datasets.persons.PersonFrame;
import eu.ec2u.data.datasets.taxonomies.Topic;

import java.net.URI;
import java.util.*;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Streams.optional;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.units.Unit.review;
import static eu.ec2u.data.datasets.units.Units.UNITS;
import static eu.ec2u.data.datasets.universities.University.POITIERS;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static java.util.Locale.ROOT;
import static java.util.stream.Stream.concat;

public final class UnitsPoitiers implements Runnable {

    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        service(store()).modify(

                array(list(units()
                        .map(json -> async(() -> unit(json).toList()))
                        .collect(joining())
                        .flatMap(Collection::stream)
                )),

                value(query(new UnitFrame(true)).where("university", criterion().any(POITIERS)))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<Value> units() {

        final String url="https://data.enseignementsup-recherche.gouv.fr"
                +"/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/exports/json"
                +"?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles";

        return Stream.of(url)
                .flatMap(optional(new GET<>(new JSON())))
                .flatMap(Value::values);
    }

    private Stream<Valuable> unit(final Value json) {
        return json.get("numero_national_de_structure").string().stream().flatMap(id -> {

            final Set<PersonFrame> heads=set(heads(json));

            return concat(

                    review(new UnitFrame()

                            .generated(true)

                            .id(UNITS.id().resolve(uuid(POITIERS, id)))
                            .university(POITIERS)
                            .isDefinedBy(source(json).orElse(null))

                            .identifier(id)

                            .homepage(set(homepage(json)))

                            .prefLabel(label(json).orElse(null))
                            .altLabel(acronym(json).orElse(null))

                            .unitOf(set(POITIERS))

                            .hasHead(heads)
                            .hasMember(heads)

                            .classification(set(classification(json).stream()))
                            .subject(set(subject(json)))

                    ).stream(),

                    heads.stream()
            );

        });
    }


    private Optional<URI> source(final Value json) {
        return json.get("fiche_rnsr").uri();
    }

    private Stream<URI> homepage(final Value json) {
        return json.get("site_web").uri().stream();
    }

    private Optional<Map<Locale, String>> label(final Value json) {
        return json.get("libelle").string()
                .map(label -> map(entry(POITIERS.locale(), label)));
    }

    private Optional<Map<Locale, String>> acronym(final Value json) {
        return json.get("sigle").string()
                .map(label -> map(entry(ROOT, label)));
    }


    private Stream<PersonFrame> heads(final Value json) {

        final List<String> forenames=json.select("prenom_du_responsable.*").strings().toList();
        final List<String> surnames=json.select("nom_du_responsable.*").strings().toList();

        return IntStream.range(0, surnames.size())

                .mapToObj(index -> {

                    final String forename=forenames.get(index);
                    final String surname=surnames.get(index);

                    return Person.person(POITIERS, forename, surname);

                })

                .flatMap(Optional::stream);
    }

    private Optional<Topic> classification(final Value json) {
        return json.get("type_de_structure").string().stream()
                .flatMap(Unit.organizations())
                .findFirst();
    }

    private Stream<Topic> subject(final Value json) {
        return json.select("domaine_scientifique.*").strings()
                .distinct()
                .flatMap(Unit.euroscivoc())
                .limit(1);
    }

}

