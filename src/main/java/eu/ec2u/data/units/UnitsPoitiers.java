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

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;

import eu.ec2u.data.persons.PersonFrame;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.EC2UOrganizations;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.taxonomies.TopicFrame;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.persons.Person.review;
import static eu.ec2u.data.units.Unit.euroscivoc;
import static eu.ec2u.data.units.Unit.review;
import static eu.ec2u.data.units.Units.TYPE_THRESHOLD;
import static eu.ec2u.data.units.Units.UNITS;
import static eu.ec2u.data.universities.University.POITIERS;
import static eu.ec2u.data.universities.University.uuid;
import static eu.ec2u.work.shim.Streams.concat;
import static eu.ec2u.work.shim.Streams.optional;
import static java.lang.String.join;
import static java.util.Locale.ROOT;

public final class UnitsPoitiers implements Runnable {

    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final String url="https://data.enseignementsup-recherche.gouv.fr"
                +"/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/exports/json"
                +"?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles";

        service(store()).modify(

                array(list(Stream.of(url)
                        .flatMap(this::units)
                        .flatMap(this::unit)
                )),

                value(query(new UnitFrame(true)).where("university", criterion().any(POITIERS)))

        );
    }


    private Stream<Value> units(final String url) {
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
                            .isDefinedBy(json.get("fiche_rnsr").uri().orElse(null))

                            .homepage(set(json.get("site_web").uri().stream()))

                            .identifier(id)

                            .prefLabel(json.get("libelle").string()
                                    .map(label -> map(entry(POITIERS.locale(), label)))
                                    .orElse(null)
                            )

                            .altLabel(json.get("sigle").string()
                                    .map(label -> map(entry(ROOT, label)))
                                    .orElse(null)
                            )

                            .unitOf(set(POITIERS))

                            .hasHead(heads)
                            .hasMember(heads)

                            .classification(set(classification(json)))
                            .subject(set(subject(json)))

                    ).stream(),

                    heads.stream()
            );

        });
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<PersonFrame> heads(final Value json) {

        final List<String> forenames=json.select("prenom_du_responsable.*").strings().toList();
        final List<String> surnames=json.select("nom_du_responsable.*").strings().toList();

        return IntStream.range(0, surnames.size())

                .mapToObj(index -> {

                    final String forename=forenames.get(index);
                    final String surname=surnames.get(index);

                    return review(new PersonFrame() // !!! factor

                            .id(Persons.PERSONS.id().resolve(uuid(POITIERS, join(", ", surname, forename))))
                            .university(POITIERS)
                            .collection(Persons.PERSONS)

                            .givenName(forename)
                            .familyName(surname)
                    );

                })

                .flatMap(Optional::stream);
    }

    private Stream<TopicFrame> classification(final Value json) {
        return json.get("type_de_structure").string().stream()
                .distinct()
                .flatMap(topic -> Resources.match(EC2UOrganizations.EC2U_ORGANIZATIONS.id(), topic, TYPE_THRESHOLD))
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(1);
    }

    private Stream<Topic> subject(final Value json) {
        return json.select("domaine_scientifique.*").strings()
                .distinct()
                .flatMap(euroscivoc())
                .limit(1);
    }

}

