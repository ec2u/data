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

import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.JSONPath;
import com.metreeca.flow.json.formats.JSON;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.persons.Persons;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.units.Units.ResearchTopics;
import static eu.ec2u.data.units.Units.Unit;
import static eu.ec2u.data.universities.University.Poitiers;
import static java.lang.String.join;
import static java.util.stream.Collectors.toList;
import static org.eclipse.rdf4j.model.util.Values.literal;

public final class UnitsPoitiers implements Runnable {

    private static final IRI Context=iri(Units.Context, "/poitiers");


    public static void main(final String... args) {
        exec(() -> new UnitsPoitiers().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {

        final String url="https://data.enseignementsup-recherche.gouv.fr"+
                "/api/explore/v2.1/catalog/datasets/fr-esr-structures-recherche-publiques-actives/exports/json"+
                "?where=%22Universit%C3%A9%20de%20Poitiers%22%20in%20tutelles";

        update(connection -> Xtream.of(url)

                .flatMap(this::units)
                .optMap(this::unit)

                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }


    private Stream<JSONPath> units(final String url) {
        return Xtream.of(url)

                .optMap(new GET<>(new JSON()))
                .map(JSONPath::new)

                .flatMap(json -> json.paths("*"));
    }

    private Optional<Frame> unit(final JSONPath json) {
        return json.string("numero_national_de_structure").map(id -> frame(

                field(ID, item(Units.Context, Poitiers, id)),
                field(TYPE, Unit),

                field(university, Poitiers.id),
                field(RDFS.ISDEFINEDBY, json.string("fiche_rnsr").map(Frame::iri)),

                field(FOAF.HOMEPAGE, json.string("site_web").map(Frame::iri)),
                field(FOAF.MBOX),

                field(ORG.IDENTIFIER, literal(id)),
                field(SKOS.PREF_LABEL, json.string("libelle").map(v -> literal(v, Poitiers.language))),
                field(SKOS.ALT_LABEL, json.string("sigle").map(v -> literal(v, Poitiers.language))),
                field(SKOS.DEFINITION),

                field(reverse(ORG.HEAD_OF), heads(json)),

                field(ORG.UNIT_OF, Poitiers.id),
                field(ORG.CLASSIFICATION, type(json)),

                field(DCTERMS.SUBJECT, subjects(json))

        ));
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

        final List<String> codes=json.strings("code_domaine_scientifique.*").collect(toList());
        final List<String> labels=json.strings("domaine_scientifique.*").collect(toList());

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

    private Stream<Frame> heads(final JSONPath json) {

        final List<String> forenames=json.strings("prenom_du_responsable.*").collect(toList());
        final List<String> surnames=json.strings("nom_du_responsable.*").collect(toList());

        return IntStream.range(0, surnames.size()).mapToObj(index -> {

            final String forename=forenames.get(index);
            final String surname=surnames.get(index);

            return frame(

                    field(ID, item(Persons.Context, Poitiers, join(", ", surname, forename))),
                    field(TYPE, FOAF.PERSON),

                    field(university, Poitiers.id),

                    field(FOAF.GIVEN_NAME, literal(forename)),
                    field(FOAF.FAMILY_NAME, literal(surname))

            );

        });
    }

}

