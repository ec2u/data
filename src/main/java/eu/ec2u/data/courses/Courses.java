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

package eu.ec2u.data.courses;

import com.metreeca.http.handlers.Delegator;
import com.metreeca.http.handlers.Router;
import com.metreeca.http.handlers.Worker;
import com.metreeca.http.jsonld.handlers.Driver;
import com.metreeca.http.jsonld.handlers.Relator;
import com.metreeca.link.Shape;

import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.http.Handler.handler;
import static com.metreeca.link.Frame.*;
import static com.metreeca.link.Query.query;
import static com.metreeca.link.Shape.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.offerings.Offerings.LearningResource;
import static eu.ec2u.data.programs.Programs.Program;
import static eu.ec2u.data.programs.Programs.hasCourse;
import static eu.ec2u.data.resources.Resources.localized;
import static eu.ec2u.data.resources.Resources.partner;
import static eu.ec2u.data.things.Schema.inLanguage;
import static eu.ec2u.data.things.Schema.schema;

public final class Courses extends Delegator {

    public static final IRI Context=item("/courses/");

    public static final IRI Course=schema("Course");

    public static final IRI courseCode=schema("courseCode");
    public static final IRI timeRequired=schema("timeRequired");
    public static final IRI coursePrerequisites=schema("coursePrerequisites");


    public static Shape Courses() { return Dataset(Course()); }

    public static Shape Course() {
        return shape(Course, LearningResource(),

                property(courseCode, optional(string())),
                property(inLanguage, multiple(string(), pattern("[a-z]{2}"))),
                property(timeRequired, optional(duration())),
                property(coursePrerequisites, optional(localized())),

                property("inProgram", reverse(hasCourse), () -> multiple(Program()))

        );
    }

    public static void main(final String... args) {
        exec(() -> create(Context, Courses.class, Course()));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Courses() {
        delegate(new Router()

                .path("/", handler(new Driver(Courses()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(RDFS.MEMBER, query(

                                        frame(

                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", WILDCARD)),

                                                field(partner, iri()),
                                                field(ORG.CLASSIFICATION, iri())

                                        )

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(Course()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", WILDCARD)),

                                field(partner, iri())

                        )))

                ))

        );
    }

}
