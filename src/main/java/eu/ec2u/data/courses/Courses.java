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

package eu.ec2u.data.courses;

import com.metreeca.flow.handlers.Delegator;
import com.metreeca.flow.handlers.Router;
import com.metreeca.flow.handlers.Worker;

import eu.ec2u.data.events.Events.EventAttendanceModeEnumeration;
import eu.ec2u.work._junk.Driver;
import eu.ec2u.work._junk.Filter;
import eu.ec2u.work._junk.Relator;
import eu.ec2u.work._junk.Shape;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.RDFS;

import static com.metreeca.flow.Handler.handler;
import static com.metreeca.flow.rdf.Values.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.create;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.datasets.Datasets.Dataset;
import static eu.ec2u.data.events.Events.audience;
import static eu.ec2u.data.offerings.Offerings.LearningResource;
import static eu.ec2u.data.persons.Persons.Person;
import static eu.ec2u.data.programs.Programs.Program;
import static eu.ec2u.data.programs.Programs.hasCourse;
import static eu.ec2u.data.resources.Resources.*;
import static eu.ec2u.data.things.Schema.*;
import static eu.ec2u.work._junk.Frame.field;
import static eu.ec2u.work._junk.Frame.frame;
import static eu.ec2u.work._junk.Shape.*;
import static eu.ec2u.work._junk.Shape.bool;
import static eu.ec2u.work._junk.Shape.string;
import static eu.ec2u.work._junk.Shape.text;
import static org.eclipse.rdf4j.model.vocabulary.XSD.ID;

public final class Courses extends Delegator {

    public static final IRI Context=item("/courses/");

    public static final IRI Course=schema("Course");
    public static final IRI CourseInstance=schema("CourseInstance");

    public static final IRI courseCode=schema("courseCode");
    public static final IRI timeRequired=schema("timeRequired");
    public static final IRI coursePrerequisites=schema("coursePrerequisites");

    public static final IRI instructor=schema("instructor");
    public static final IRI courseMode=schema("courseMode");
    public static final IRI courseWorkload=schema("courseWorkload");


    public static Shape Courses() { return Dataset(shape(Course(), CourseInstance())); }

    public static Shape Course() {
        return shape(Course, LearningResource(),

                property(courseCode, optional(string())),
                property(inLanguage, multiple(string(), Shape.pattern("[a-z]{2}"))),
                property(timeRequired, optional(duration())),
                property(coursePrerequisites, optional(text(locales()))),

                property("inProgram", reverse(hasCourse), () -> multiple(Program()))

        );
    }

    public static Shape CourseInstance() {
        return shape(CourseInstance, Thing(),

                property(audience, multiple(string())), // !!! review

                property(isAccessibleForFree, optional(bool())),
                property(courseWorkload, optional(duration())),

                property(courseMode, optional(Resource(), in(EventAttendanceModeEnumeration.values()))),
                property(instructor, optional(Person()))

        );
    }


    public static void main(final String... args) {
        exec(() -> create(Context, Courses.class, Course(), CourseInstance()));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public Courses() {
        delegate(new Router()

                .path("/", handler(new Driver(Courses()), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                field(RDFS.MEMBER, Filter.query(

                                        frame(

                                                field(ID, iri()),
                                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                                field(university, iri()),
                                                field(ORG.CLASSIFICATION, iri())

                                        )

                                ))

                        )))

                ))

                .path("/{code}", handler(new Driver(shape(Course(), CourseInstance())), new Worker()

                        .get(new Relator(frame(

                                field(ID, iri()),
                                field(RDFS.LABEL, literal("", ANY_LOCALE)),

                                field(university, iri())

                        )))

                ))

        );
    }

}
