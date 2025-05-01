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
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Valuable;
import com.metreeca.mesh.Value;

import eu.ec2u.data.persons.Person;
import eu.ec2u.data.persons.PersonFrame;
import eu.ec2u.data.persons.Persons;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.TopicFrame;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.taxonomies.EC2UOrganizations.EC2U_ORGANIZATIONS;
import static eu.ec2u.data.taxonomies.EuroSciVoc.EUROSCIVOC;
import static eu.ec2u.data.units.Unit.review;
import static eu.ec2u.data.units.Units.*;
import static eu.ec2u.data.universities.University.Poitiers;
import static eu.ec2u.data.universities.University.uuid;
import static java.lang.String.join;
import static java.util.Locale.ROOT;

public final class UnitsPoitiers implements Runnable {

    private static final URI CONTEXT=UNITS.id().resolve("poitiers");


    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final String url="https://data.enseignementsup-recherche.gouv.fr"
                         +"/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/exports/json"
                         +"?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles";

        service(store()).partition(CONTEXT).update(array(list(Xtream.of(url)

                .flatMap(this::units)
                .flatMap(this::unit)

        )), FORCE);
    }


    private Stream<Value> units(final String url) {
        return Xtream.of(url)
                .optMap(new GET<>(new JSON()))
                .flatMap(Value::values);
    }

    private Stream<? extends Valuable> unit(final Value json) {
        return json.get("numero_national_de_structure").string().map(id -> new UnitFrame()

                .generated(true)

                .id(UNITS.id().resolve(uuid(Poitiers(), id)))
                .university(Poitiers())
                .isDefinedBy(json.get("fiche_rnsr").uri().orElse(null))

                .homepage(set(json.get("site_web").uri().stream()))

                .identifier(id)

                .prefLabel(json.get("libelle").string()
                        .map(label -> map(entry(Poitiers().locale(), label)))
                        .orElse(null)
                )

                .altLabel(json.get("sigle").string()
                        .map(label -> map(entry(ROOT, label)))
                        .orElse(null)
                )

                .unitOf(set(Poitiers()))

                .classification(set(classification(json)))
                .subject(set(subject(json)))

        ).flatMap(unit -> review(unit, Poitiers().locale())).stream().flatMap(unit -> {

            final Set<PersonFrame> heads=set(heads(json)
                    .map(p -> p.headOf(set(unit)).memberOf(set(unit)))
            );

            return Xtream.from(
                    Stream.of(unit),
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

                    return new PersonFrame() // !!! factor

                            .id(Persons.PERSONS.id().resolve(uuid(Poitiers(), join(", ", surname, forename))))
                            .university(Poitiers())
                            .collection(Persons.PERSONS)

                            .givenName(forename)
                            .familyName(surname);

                })

                .map(Person::review)
                .flatMap(Optional::stream);
    }

    private Stream<TopicFrame> classification(final Value json) {
        return json.get("type_de_structure").string().stream()
                .distinct()
                .flatMap(topic -> Resources.match(EC2U_ORGANIZATIONS, topic, TYPE_THRESHOLD))
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(1);
    }

    private Stream<TopicFrame> subject(final Value json) {
        return json.select("domaine_scientifique.*").strings()
                .distinct()
                .flatMap(topic -> Resources.match(EUROSCIVOC, topic, SUBJECT_THRESHOLD))
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(1);
    }

}

