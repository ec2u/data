/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.actions.Fill;
import com.metreeca.http.rdf4j.actions.GraphQuery;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.rdf4j.services.Graph;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;
import com.metreeca.link._Focus;

import eu.ec2u.data.Data;
import eu.ec2u.data.EC2U;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.concepts.OrganizationTypes.Centre;
import static eu.ec2u.data.concepts.OrganizationTypes.Department;
import static eu.ec2u.data.resources.Resources.owner;
import static eu.ec2u.data.units.Units.Unit;
import static eu.ec2u.data.universities._Universities.Pavia;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

public final class UnitsPavia implements Runnable {

    private static final IRI Context=iri(Units.Context, "/pavia");

    private static final Map<IRI, IRI> Types=Map.ofEntries(
            entry(VIVO.AcademicDepartment, Department),
            entry(VIVO.Center, Centre)
    );


    public static void main(final String... args) {
        Data.exec(() -> new UnitsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        update(connection -> {

            Xtream.of(Instant.EPOCH)

                    .flatMap(this::units)
                    .map(this::unit)


                    .flatMap(Frame::stream)
                    .batch(0)

                    .forEach(new Upload()
                            .contexts(Context)
                            .clear(true)
                    );

        });
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<_Focus> units(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<>()

                        .model("construct where {\n"
                                +"\n"
                                +"\t?s a <{type}>; ?p ?o\n"
                                +"\n"
                                +"}"
                        )

                        .values("type", Types.keySet())

                )

                .flatMap(new GraphQuery()
                        .graph(new Graph(repository("vivo-unipv")))
                )

                .batch(0)

                .flatMap(model -> Types.keySet().stream()

                        .flatMap(type -> _Focus.focus(type, model)
                                .shift(reverse(RDF.TYPE))
                                .split()
                        )

                );
    }

    private Frame unit(final _Focus focus) {

        final Optional<Literal> label=focus.shift(RDFS.LABEL).value(asString())
                .filter(not(String::isEmpty))
                .map(name -> literal(name, Pavia.Language));

        return frame(

                field(ID, EC2U.item(Units.Context, focus.value(asIRI()).orElseThrow().stringValue())), // !!! review

                field(RDF.TYPE, Unit),
                field(owner, Pavia.Id),

                field(DCTERMS.TITLE, label),
                field(SKOS.PREF_LABEL, label),

                field(ORG.UNIT_OF, Pavia.Id),

                field(ORG.CLASSIFICATION, focus.shift(RDF.TYPE).values()
                        .map(Types::get)
                        .filter(Objects::nonNull)
                        .findFirst()
                )

        );

    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * VIVO RDF vocabulary.
     *
     * @see <a href="https://bioportal.bioontology.org/ontologies/VIVO/">VIVO Ontology for Researcher Discovery</a>
     */
    private static final class VIVO {

        private static final String Namespace="http://vivoweb.org/ontology/core#";

        private static final IRI AcademicDepartment=iri(Namespace, "AcademicDepartment");
        private static final IRI Center=iri(Namespace, "Center");

    }

}
