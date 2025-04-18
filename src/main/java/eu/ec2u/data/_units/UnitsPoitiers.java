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

package eu.ec2u.data._units;

import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.work.Xtream;
import com.metreeca.mesh.Value;

import eu.ec2u.data._agents.FOAFPerson;
import eu.ec2u.data._persons.PersonFrame;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.work._junk.Frame;
import eu.ec2u.work._junk.JSONPath;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.tools.Store.Options.FORCE;
import static com.metreeca.mesh.util.Collections.*;

import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.__._Data.exec;
import static eu.ec2u.data._persons.Persons.PERSONS;
import static eu.ec2u.data._units.Units.UNITS;
import static eu.ec2u.data._universities.University.POITIERS;
import static eu.ec2u.data._universities.University.uuid;
import static eu.ec2u.data.units.Units.ResearchTopics;
import static eu.ec2u.data.universities.University.Poitiers;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static java.lang.String.join;
import static java.util.Locale.ROOT;
import static org.eclipse.rdf4j.model.util.Values.literal;
import static org.eclipse.rdf4j.model.vocabulary.RDF.TYPE;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class UnitsPoitiers implements Runnable {

    private static final URI CONTEXT=UNITS.resolve("poitiers");


    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final String url="https://data.enseignementsup-recherche.gouv.fr"+
                         "/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/exports/json"+
                         "?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles";

        service(store()).partition(CONTEXT).update(array(list(Xtream.of(url)

                .flatMap(this::units)
                .optMap(this::unit)

                .map(UnitFrame::value)
                .optMap(new Validate())

        )), FORCE);
    }


    private Stream<Value> units(final String url) {
        return Xtream.of(url)
                .optMap(new GET<>(new JSON()))
                .flatMap(Value::values);
    }

    private Optional<Unit> unit(final Value json) {
        return json.get("numero_national_de_structure").string().map(id -> new UnitFrame()

                        .id(UNITS.resolve(uuid(POITIERS, id)))
                        .university(POITIERS)
                        .isDefinedBy(json.get("fiche_rnsr").uri().orElse(null))

                        .homepage(set(json.get("site_web").uri().stream()))

                        .identifier(entry(POITIERS.id(), id))

                        .prefLabel(map(entry(POITIERS.locale(), json.get("libelle").string().orElse(""))))
                        .altLabel(map(entry(ROOT, json.get("sigle").string().orElse(""))))

                        .hasHead(set(heads(json)))

                        .unitOf(set(POITIERS))

                // !!!field(ORG.CLASSIFICATION, type(json)),

                // !!! field(DCTERMS.SUBJECT, subjects(json))

        );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Optional<Frame> type(final JSONPath json) { // !!! map to standard types
        return json.string("code_de_type_de_structure").map(type -> frame(

                field(ID, item(OrganizationTypes.UnitTypes, Poitiers, type)),
                field(TYPE, SKOS.CONCEPT),

                field(SKOS.IN_SCHEME, OrganizationTypes.OrganizationTypes),
                field(SKOS.BROADER, OrganizationTypes.UnitTypes),

                field(SKOS.PREF_LABEL, json.string("type_de_structure").map(v -> literal(v, Poitiers.language)))

        ));
    }


    private Stream<Frame> subjects(final JSONPath json) { // !!! map to EuroSciVoc

        final List<String> codes=json.strings("code_domaine_scientifique.*").toList();
        final List<String> labels=json.strings("domaine_scientifique.*").toList();

        return IntStream.range(0, codes.size()).mapToObj(index -> {

            final String code=codes.get(index);
            final String label=labels.get(index);

            return frame(

                    field(ID, item(ResearchTopics, Poitiers, code)),
                    field(TYPE, SKOS.CONCEPT),

                    field(SKOS.TOP_CONCEPT_OF, ResearchTopics),

                    field(SKOS.NOTATION, literal(code)),
                    field(SKOS.PREF_LABEL, literal(label, Poitiers.language))

            );

        });
    }

    private Stream<FOAFPerson> heads(final Value json) {

        final List<String> forenames=json.select("prenom_du_responsable.*").strings().toList();
        final List<String> surnames=json.select("nom_du_responsable.*").strings().toList();

        return IntStream.range(0, surnames.size()).mapToObj(index -> {

            final String forename=forenames.get(index);
            final String surname=surnames.get(index);

            return new PersonFrame()

                    .id(PERSONS.resolve(uuid(POITIERS, join(", ", surname, forename))))
                    .university(POITIERS)

                    .givenName(forename)
                    .familyName(surname);

        });
    }

}

