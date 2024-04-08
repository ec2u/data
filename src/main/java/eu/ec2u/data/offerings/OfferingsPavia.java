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

package eu.ec2u.data.offerings;

import com.metreeca.http.rdf.Values;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.rdf4j.services.Graph;
import com.metreeca.http.work.Xtream;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.ISCED2011;
import eu.ec2u.data.concepts.Languages;
import eu.ec2u.data.courses.Courses;
import eu.ec2u.data.programs.Programs;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.things.Schema;
import eu.ec2u.work.focus.Focus;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.VCARD4;
import org.eclipse.rdf4j.model.vocabulary.XSD;
import org.eclipse.rdf4j.repository.RepositoryConnection;

import java.time.Instant;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.http.rdf.Values.iri;
import static com.metreeca.http.toolkits.Identifiers.AbsoluteIRIPattern;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.Data.repository;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.courses.Courses.*;
import static eu.ec2u.data.offerings.Offerings.*;
import static eu.ec2u.data.programs.Programs.*;
import static eu.ec2u.data.resources.Resources_.localized;
import static eu.ec2u.data.universities._Universities.Pavia;
import static eu.ec2u.work.focus.Focus.focus;
import static java.lang.String.format;
import static java.util.Map.entry;
import static java.util.stream.Collectors.toSet;

public final class OfferingsPavia implements Runnable {

    private static final IRI Context=iri(Offerings.Context, "/pavia");


    private static final Map<String, IRI> DegreeToLevel=Map.ofEntries(

            entry("Bachelor’s Degree", ISCED2011.Level6),
            entry("Laurea", ISCED2011.Level6),

            entry("Laurea Magistrale", ISCED2011.Level7),
            entry("Master’s Degree", ISCED2011.Level7),
            entry("Laurea Magistrale Ciclo Unico 6 anni", ISCED2011.Level7),
            entry("Single-Cycle Master’s Degree", ISCED2011.Level7),
            entry("Laurea Magistrale Ciclo Unico 5 anni", ISCED2011.Level7),

            entry("Corso di Dottorato", ISCED2011.Level8),

            entry("Scuola di Specializzazione", ISCED2011.Level9)

    );


    public static void main(final String... args) {
        exec(() -> new OfferingsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Graph graph=new Graph(repository("vivo-unipv"));


    @Override public void run() {
        update(connection -> Xtream.of(Instant.EPOCH)

                .flatMap(instant -> Stream.of(
                        programs(instant),
                        courses(instant)
                ))

                .flatMap(Collection::stream)
                .flatMap(Frame::stream)
                .batch(0)

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )

        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Set<Frame> programs(final Instant synced) {
        return graph.query(connection -> Xtream.of(synced)

                .flatMap(instant -> programs(connection, instant))
                .optMap(this::program)

                .collect(toSet())
        );
    }

    private Stream<Focus> programs(final RepositoryConnection connection, final Instant synced) {
        return focus(Set.of(VIVO.AcademicDegree), connection)
                .seq(reverse(RDF.TYPE))
                .cache()
                .split();
    }

    private Optional<Frame> program(final Focus focus) {
        return focus.value().map(program -> frame(

                field(ID, item(Programs.Context, Pavia, program.stringValue())),

                field(RDF.TYPE, EducationalOccupationalProgram),
                field(Resources.owner, Pavia.Id),

                field(Schema.name, localized(focus.seq(RDFS.LABEL).values(), Pavia.Language)),

                field(Schema.url, focus.seq(VCARD4.URL).values()
                        .map(Value::stringValue)
                        .filter(AbsoluteIRIPattern.asMatchPredicate())
                        .map(Values::iri)
                ),

                field(educationalLevel,
                        focus.seq(VIVO.termType).value().map(Value::stringValue).map(DegreeToLevel::get)
                ),

                field(educationalCredentialAwarded, focus.seq(VIVO.termType).values()),

                field(assesses, localized(focus.seq(HEMO.courseObjectiveDescription).values(), Pavia.Language)), // !!!
                field(programPrerequisites, localized(focus.seq(HEMO.enrollmentRequirementsDescription).values(), Pavia.Language)),

                field(hasCourse, focus.seq(VIVO.conceptAssociatedWith).values().map(course ->
                        item(Courses.Context, Pavia, course.stringValue()))
                )

        ));
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Set<Frame> courses(final Instant synced) {
        return graph.query(connection -> Xtream.of(synced)

                .flatMap(instant -> courses(connection, instant))
                .optMap(this::course)

                .collect(toSet())
        );
    }

    private Stream<Focus> courses(final RepositoryConnection connection, final Instant synced) {
        return focus(Set.of(VIVO.Course), connection)
                .seq(reverse(RDF.TYPE))
                .cache()
                .split();
    }

    private Optional<Frame> course(final Focus focus) {
        return focus.value().map(course -> frame(

                field(ID, item(Courses.Context, Pavia, course.stringValue())),

                field(RDF.TYPE, Course),
                field(Resources.owner, Pavia.Id),

                field(Schema.name, localized(focus.seq(RDFS.LABEL).values(), Pavia.Language)),

                field(courseCode, focus.seq(VIVO.identifier).values()),

                field(Schema.inLanguage, literal(focus.seq(HEMO.courseTeachingLanguage).value()
                        .map(Value::stringValue)
                        .flatMap(Languages::languageCode)
                        .orElse(Pavia.Language)
                )),

                field(teaches, localized(focus.seq(HEMO.courseContentsDescription).values(), Pavia.Language)),
                field(assesses, localized(focus.seq(HEMO.courseObjectiveDescription).values(), Pavia.Language)),
                field(coursePrerequisites, localized(focus.seq(HEMO.coursePrerequisitesDescription).values(), Pavia.Language)),

                // field(competencyRequired,
                //         localized(focus.seq(HEMO.courseAssessmentMethodsDescription).values(), Pavia.Language)
                // ),

                field(learningResourceType,
                        localized(focus.seq(HEMO.courseTeachingMethodsDescription).values(), Pavia.Language)
                ),


                field(numberOfCredits, focus.seq(VIVO.hasValue).value()
                        .flatMap(Values::integer)
                        .map(Offerings_::ects)
                        .map(Frame::literal)
                ),

                field(timeRequired, focus.seq(VIVO.dateTimeValue, RDFS.LABEL).value()
                        .flatMap(Values::integer)
                        .map(hours -> literal(format("PT%dH", hours), XSD.DURATION))
                ))

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


        private static final IRI AcademicDegree=iri(Namespace, "AcademicDegree");
        private static final IRI Course=iri(Namespace, "Course");

        private static final IRI conceptAssociatedWith=iri(Namespace, "conceptAssociatedWith");
        private static final IRI termType=iri(Namespace, "termType");

        private static final IRI identifier=iri(Namespace, "identifier");
        private static final IRI hasValue=iri(Namespace, "hasValue");
        private static final IRI dateTimeValue=iri(Namespace, "dateTimeValue");

    }

    private static final class HEMO {

        private static final String Namespace="http://data.cineca.it/education/HEMO#";


        private static final IRI enrollmentRequirementsDescription=iri(Namespace, "enrollmentRequirementsDescription");

        private static final IRI courseTeachingLanguage=iri(Namespace, "courseTeachingLanguage");
        private static final IRI courseContentsDescription=iri(Namespace, "courseContentsDescription");
        private static final IRI courseObjectiveDescription=iri(Namespace, "courseObjectiveDescription");
        private static final IRI coursePrerequisitesDescription=iri(Namespace, "coursePrerequisitesDescription");
        private static final IRI courseTeachingMethodsDescription=iri(Namespace, "courseTeachingMethodsDescription");
        private static final IRI courseAssessmentMethodsDescription=iri(Namespace, "courseAssessmentMethodsDescription");

    }

}
