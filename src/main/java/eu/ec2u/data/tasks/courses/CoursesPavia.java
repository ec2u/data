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

package eu.ec2u.data.tasks.courses;

import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.GraphQuery;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.cities.Pavia;
import eu.ec2u.data.terms.EC2U;
import eu.ec2u.data.terms.VIVO;
import org.eclipse.rdf4j.model.Literal;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Lambdas.task;
import static com.metreeca.http.Locator.service;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.ports.Courses.Course;
import static eu.ec2u.data.tasks.Tasks.*;

import static java.util.function.Predicate.not;

public final class CoursesPavia implements Runnable {

    public static void main(final String... args) {
        exec(() -> new CoursesPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::courses)
                .map(this::course)

                .sink(units -> upload(EC2U.courses,
                        validate(Course(), Set.of(EC2U.Course), units),
                        () -> service(graph()).update(task(connection -> Stream

                                .of(""
                                        +"prefix ec2u: </terms/>\n"
                                        +"prefix org: <http://www.w3.org/ns/org#>\n"
                                        +"\n"
                                        +"delete where {\n"
                                        +"\n"
                                        +"\t?u a ec2u:Course ;\n"
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

    private Xtream<Frame> courses(final Instant synced) {
        return Xtream.of(synced)

                .flatMap(new Fill<>()

                        .model("construct where {\n"
                                +"\n"
                                +"\t?s a <{type}>; ?p ?o\n"
                                +"\n"
                                +"}"
                        )

                        .values("type", VIVO.Course)

                )

                .flatMap(new GraphQuery()
                        .graph(new Graph(repository("vivo-unipv")))
                )

                .limit(100)

                .batch(0)

                .flatMap(model -> frame(VIVO.Course, model)
                        .frames(inverse(RDF.TYPE))
                );
    }

    private Frame course(final Frame frame) {
        return frame(iri(EC2U.courses, md5(frame.focus().stringValue())))

                .values(RDF.TYPE, EC2U.Course)
                .value(EC2U.university, Pavia.University)

                .value(DCTERMS.TITLE, frame.value(RDFS.LABEL)
                        .filter(not(v -> v.stringValue().isEmpty()))
                        .map(name -> literal(name.stringValue(), Values.literal(name)
                                .flatMap(Literal::getLanguage)
                                .orElse(Pavia.Language)
                        ))
                );
    }

}
