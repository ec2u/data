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

package eu.ec2u.data.resources.units;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.link.Frame;
import com.metreeca.rdf4j.actions.GraphQuery;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.Data;
import eu.ec2u.data.ontologies.VIVO;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.resources.concepts.Units;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.*;

import static com.metreeca.core.toolkits.Identifiers.md5;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;

import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data._delta.Uploads.upload;
import static eu.ec2u.data.ontologies.EC2U.Universities.Pavia;
import static eu.ec2u.data.resources.units.Units.Unit;
import static eu.ec2u.data.resources.units.Units.clear;
import static eu.ec2u.data.utilities.validation.Validators.validate;

import static java.util.function.Predicate.not;

public final class UnitsPavia implements Runnable {

    private static final Map<IRI, IRI> Types=Map.ofEntries(
            Map.entry(VIVO.AcademicDepartment, Units.Department),
            Map.entry(VIVO.Center, Units.Centre)
    );


    public static void main(final String... args) {
        Data.exec(() -> new UnitsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .map(this::unit)

                .sink(units -> upload(eu.ec2u.data.resources.units.Units.Context,
                        validate(Unit(), Set.of(eu.ec2u.data.resources.units.Units.Unit), units),
                        () -> clear(Pavia.Id)
                ));
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

        return frame(iri(eu.ec2u.data.resources.units.Units.Context, md5(frame.focus().stringValue())))

                .values(RDF.TYPE, eu.ec2u.data.resources.units.Units.Unit)
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

}
