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

package eu.ec2u.data.courses;

import com.metreeca.core.Xtream;
import com.metreeca.core.actions.Fill;
import com.metreeca.link.Frame;
import com.metreeca.link.Values;
import com.metreeca.rdf4j.actions.GraphQuery;
import com.metreeca.rdf4j.actions.Upload;
import com.metreeca.rdf4j.services.Graph;

import eu.ec2u.data.concepts.Languages;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.*;

import java.time.Instant;
import java.util.Set;

import static com.metreeca.core.Locator.service;
import static com.metreeca.core.services.Logger.logger;
import static com.metreeca.core.services.Logger.time;
import static com.metreeca.link.Frame.frame;
import static com.metreeca.link.Values.*;
import static com.metreeca.link.shifts.Seq.seq;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.EC2U.University.Pavia;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.courses.Courses.Course;
import static eu.ec2u.work.Work.localized;
import static eu.ec2u.work.validation.Validators.validate;

public final class CoursesPavia implements Runnable {

    private static final IRI Context=iri(Courses.Context, "/pavia");


    public static void main(final String... args) {
        exec(() -> new CoursesPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override public void run() {
        Xtream.of(Instant.EPOCH)

                .flatMap(this::courses)
                .map(this::course)

                .pipe(courses -> validate(Course(), Set.of(Course), courses))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                );
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
        return frame(item(Courses.Context, Pavia, frame.focus().stringValue()))

                .values(RDF.TYPE, Course)
                .value(Resources.university, Pavia.Id)

                .values(Schema.name, localized(frame.values(RDFS.LABEL)))

                .value(Schema.courseCode, frame.value(VIVO.identifier))

                .value(Schema.inLanguage, literal(frame.value(HEMO.courseTeachingLanguage)
                        .map(Value::stringValue)
                        .flatMap(Languages::languageCode)
                        .orElse(Pavia.Language)
                ))

                .values(Schema.teaches, localized(frame.values(HEMO.courseContentsDescription)))
                .values(Schema.assesses, localized(frame.values(HEMO.courseObjectiveDescription)))
                .values(Schema.coursePrerequisites, localized(frame.values(HEMO.coursePrerequisitesDescription)))
                .values(Schema.learningResourceType, localized(frame.values(HEMO.courseTeachingMethodsDescription)))
                .values(Schema.competencyRequired, localized(frame.values(HEMO.courseAssessmentMethodsDescription)))

                .integer(Schema.numberOfCredits, frame.value(VIVO.hasValue)
                        .flatMap(Values::integer)
                        .map(Courses::ects)
                )

                .value(Schema.timeRequired, frame.value(seq(VIVO.dateTimeValue, RDFS.LABEL))
                        .flatMap(Values::integer)
                        .map(hours -> literal(String.format("PT%dH", hours), XSD.DURATION))
                );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final class HEMO {

        private static final String Namespace="http://data.cineca.it/education/HEMO#";


        private static final IRI courseTeachingLanguage=iri(Namespace, "courseTeachingLanguage");
        private static final IRI courseContentsDescription=iri(Namespace, "courseContentsDescription");
        private static final IRI courseObjectiveDescription=iri(Namespace, "courseObjectiveDescription");
        private static final IRI coursePrerequisitesDescription=iri(Namespace, "coursePrerequisitesDescription");
        private static final IRI courseTeachingMethodsDescription=iri(Namespace, "courseTeachingMethodsDescription");
        private static final IRI courseAssessmentMethodsDescription=iri(Namespace, "courseAssessmentMethodsDescription");

    }

    /**
     * VIVO RDF vocabulary.
     *
     * @see <a href="https://bioportal.bioontology.org/ontologies/VIVO/">VIVO Ontology for Researcher Discovery</a>
     */
    private static final class VIVO {

        private static final String Namespace="http://vivoweb.org/ontology/core#";


        private static final IRI Course=iri(Namespace, "Course");

        private static final IRI identifier=iri(Namespace, "identifier");
        private static final IRI hasValue=iri(Namespace, "hasValue");
        private static final IRI dateTimeValue=iri(Namespace, "dateTimeValue");

    }

}
