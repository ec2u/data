/*
 * Copyright © 2020-2022 EC2U Alliance
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

package eu.ec2u.data.tasks.units;

import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.link.Frame;
import com.metreeca.rdf4j.actions.GraphQuery;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.cities.Pavia;
import eu.ec2u.data.terms.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Lambdas.task;
import static com.metreeca.http.Locator.service;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.ports.Units.Unit;
import static eu.ec2u.data.tasks.Tasks.*;

import static java.util.function.Predicate.not;

public final class UnitsPavia implements Runnable {

    private static final Map<IRI, IRI> Types=Map.ofEntries(
            Map.entry(VIVO.AcademicDepartment, Units.Department),
            Map.entry(VIVO.Center, Units.Center)
    );


    public static void main(final String... args) {
        exec(() -> new UnitsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::units)
                .map(this::unit)

                .sink(units -> upload(EC2U.units,
                        validate(Unit(), Set.of(EC2U.Unit), units),
                        () -> service(graph()).update(task(connection -> Stream

                                .of(""
                                        +"prefix ec2u: </terms/>\n"
                                        +"prefix org: <http://www.w3.org/ns/org#>\n"
                                        +"\n"
                                        +"delete where {\n"
                                        +"\n"
                                        +"\t?u a ec2u:Unit ;\n"
                                        +"\t\tec2u:university $university ;\n"
                                        +"\t\t?p ?o .\n"
                                        +"\n"
                                        +"}"
                                )

                                .forEach(new Update()
                                        .base(EC2U.Base)
                                        .binding("university", Pavia.University)
                                )

                        ))
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

        return frame(iri(EC2U.units, md5(frame.focus().stringValue())))

                .values(RDF.TYPE, EC2U.Unit)
                .value(EC2U.university, Pavia.University)

                .value(DCTERMS.TITLE, label)
                .value(SKOS.PREF_LABEL, label)

                .value(ORG.UNIT_OF, Pavia.University)

                .value(ORG.CLASSIFICATION, frame.values(RDF.TYPE)
                        .map(Types::get)
                        .filter(Objects::nonNull)
                        .findFirst()
                );

    }

}
