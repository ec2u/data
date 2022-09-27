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

import com.metreeca.core.Strings;
import com.metreeca.http.Xtream;
import com.metreeca.http.actions.Fill;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.GraphQuery;
import com.metreeca.rdf4j.actions.Update;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.cities.Pavia;
import eu.ec2u.data.terms.*;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.core.Identifiers.md5;
import static com.metreeca.core.Lambdas.task;
import static com.metreeca.http.Locator.service;
import static com.metreeca.http.services.Logger.logger;
import static com.metreeca.http.services.Logger.time;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.link.shifts.Seq.seq;
import static com.metreeca.rdf4j.services.Graph.graph;

import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.ports.Courses.Course;
import static eu.ec2u.data.tasks.Tasks.*;
import static eu.ec2u.data.work.Work.localized;

import static java.util.Map.entry;

public final class CoursesPavia implements Runnable {

    private static final Map<String, String> Languages=Map.ofEntries(
            entry("italian", "it"),
            entry("italiano", "it"),
            entry("english", "en"),
            entry("inglese", "en")
    );


    public static void main(final String... args) {
        exec(() -> new CoursesPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::courses)
                .map(this::course)

                .sink(courses -> upload(EC2U.courses,
                        validate(Course(), Set.of(EC2U.Course), courses),
                        () -> service(graph()).update(task(connection -> Stream

                                .of(""
                                        +"prefix ec2u: </terms/>\n"
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

                .batch(0)

                .flatMap(model -> time(() -> frame(VIVO.Course, model)
                                .frames(inverse(RDF.TYPE))
                        ).apply((elapsed, stream) ->
                                service(logger()).info(this, String.format("split in <%,d> ms", elapsed))
                        )
                );
    }

    private Frame course(final Frame frame) {
        return frame(iri(EC2U.courses, md5(frame.focus().stringValue())))

                .values(RDF.TYPE, EC2U.Course)
                .value(EC2U.university, Pavia.University)

                .values(DCTERMS.TITLE, localized(frame.values(RDFS.LABEL)))

                .value(Schema.courseCode, frame.value(VIVO.identifier))

                .value(Schema.inLanguage, literal(frame.value(HEMO.courseTeachingLanguage)
                        .map(Value::stringValue)
                        .map(Strings::normalize)
                        .map((Strings::lower))
                        .map(Languages::get)
                        .orElse(Pavia.Language)
                ))

                .values(Schema.teaches, localized(frame.values(HEMO.courseContentsDescription)))
                .values(Schema.assesses, localized(frame.values(HEMO.courseObjectiveDescription)))
                .values(Schema.coursePrerequisites, localized(frame.values(HEMO.coursePrerequisitesDescription)))
                .values(Schema.learningResourceType, localized(frame.values(HEMO.courseTeachingMethodsDescription)))
                .values(Schema.competencyRequired, localized(frame.values(HEMO.courseAssessmentMethodsDescription)))

                .integer(Schema.numberOfCredits, frame.value(VIVO.hasValue)
                        .flatMap(Values::integer)
                )

                .value(Schema.timeRequired, frame.value(seq(VIVO.dateTimeValue, RDFS.LABEL))
                        .flatMap(Values::integer)
                        .map(hours -> literal(String.format("PT%dH", hours), XSD.DURATION))
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class HEMO {

        private static final String Namespace="http://data.cineca.it/education/HEMO#";


        /**
         * Creates a term in the HEMO namespace.
         *
         * @param id the identifier of the term to be created
         *
         * @return the HEMO term identified by {@code id}
         *
         * @throws NullPointerException if {@code id} is null
         */
        private static IRI term(final String id) {

            if ( id == null ) {
                throw new NullPointerException("null id");
            }

            return iri(Namespace, id);
        }

        private static final IRI courseTeachingLanguage=term("courseTeachingLanguage");
        private static final IRI courseContentsDescription=term("courseContentsDescription");
        private static final IRI courseObjectiveDescription=term("courseObjectiveDescription");
        private static final IRI coursePrerequisitesDescription=term("coursePrerequisitesDescription");
        private static final IRI courseTeachingMethodsDescription=term("courseTeachingMethodsDescription");
        private static final IRI courseAssessmentMethodsDescription=term("courseAssessmentMethodsDescription");

    }

}