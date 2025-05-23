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

package eu.ec2u.data.programs;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;
import com.metreeca.flow.jsonld.handlers.Driver;
import com.metreeca.flow.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import eu.ec2u.data.offerings.Offerings;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.flow.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.concepts.Concepts.Concept;
import static eu.ec2u.data.courses.Courses.Course;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.offerings.Offerings.LearningResource;
import static eu.ec2u.data.resources.Resources.locales;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.things.Schema.schema;

public final class Programs extends Delegator {

    public static final IRI Context=item("/programs/");

    public static final IRI EducationalOccupationalProgram=schema("EducationalOccupationalProgram");

    public static final IRI timeToComplete=schema("timeToComplete");
    public static final IRI programPrerequisites=schema("programPrerequisites");
    public static final IRI programType=schema("programType");
    public static final IRI hasCourse=schema("hasCourse");


    public static Shape Programs() { return Dataset(Program()); }

    public static Shape Program() {
        return shape(EducationalOccupationalProgram, LearningResource(),

                property(timeToComplete, optional(duration())),
                property(programPrerequisites, optional(text(locales()))),

                property(programType, optional(Concept(), scheme(Offerings.Types))),

                property(hasCourse, () -> multiple(Course()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Programs.class, Program()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Programs() {
        delegate(new Router()

                .path("/", handler(new Driver(Programs()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                field(RDFS.MEMBER, query(

                                        frame(

                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                                field(university, iri()),
                                                field(programType, iri())

                                        )

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(Program()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                field(university, iri()),
                                field(programType, iri())

                        )))

                ))

        );

    }

}
