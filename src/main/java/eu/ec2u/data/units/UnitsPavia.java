/*
 * Copyright © 2020-2023 EC2U Alliance
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

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.link.Frame;
import com.metreeca.rdf4j.actions.GraphQuery;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.Data;
import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.UnitTypes;
import eu.ec2u.data.resources.Resources;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.*;

import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;

import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.EC2U.University.Pavia;
import static eu.ec2u.data.units.Units.Unit;
import static eu.ec2u.work.validation.Validators.validate;

import static java.util.Map.entry;
import static java.util.function.Predicate.not;

public final class UnitsPavia implements Runnable {

    private static final IRI Context=iri(Units.Context, "/pavia");

    private static final Map<IRI, IRI> Types=Map.ofEntries(
            entry(VIVO.AcademicDepartment, UnitTypes.Department),
            entry(VIVO.Center, UnitTypes.Centre)
    );


    public static void main(final String... args) {
        Data.exec(() -> new UnitsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .map(this::unit)

                .pipe(units -> validate(Unit(), Set.of(Unit), units))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Frame> units(final Instant synced) {
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

                        .flatMap(type -> frame(type, model)
                                .frames(inverse(RDF.TYPE))
                        )

                );
    }

    private Frame unit(final Frame frame) {

        final Optional<Literal> label=frame.string(RDFS.LABEL)
                .filter(not(String::isEmpty))
                .map(name -> literal(name, Pavia.Language));

        return frame(EC2U.item(Units.Context, frame.focus().stringValue()))

                .values(RDF.TYPE, Unit)
                .value(Resources.university, Pavia.Id)

                .value(DCTERMS.TITLE, label)
                .value(SKOS.PREF_LABEL, label)

                .value(ORG.UNIT_OF, Pavia.Id)

                .value(ORG.CLASSIFICATION, frame.values(RDF.TYPE)
                        .map(Types::get)
                        .filter(Objects::nonNull)
                        .findFirst()
                );

    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
