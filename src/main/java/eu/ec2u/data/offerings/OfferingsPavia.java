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

import com.metreeca.http.rdf4j.services.Graph;

import eu.ec2u.data.concepts.ISCED2011;
import org.eclipse.rdf4j.model.IRI;

import java.util.Map;

import static com.metreeca.http.rdf.Values.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.Data.repository;
import static java.util.Map.entry;

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
        // Xtream.of(Instant.EPOCH)
        //
        //         .flatMap(instant -> Xtream.from(
        //
        //                 Xtream.from(programs(instant))
        //                         .pipe(programs -> validate(Program(), Set.of(Program), programs)),
        //
        //                 Xtream.from(courses(instant))
        //                         .pipe(courses -> validate(Course(), Set.of(Course), courses))
        //
        //         ))
        //
        //         .forEach(new Upload()
        //                 .contexts(Context)
        //                 .clear(true)
        //         );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // private Set<Frame> programs(final Instant synced) {
    //     return graph.query(connection -> Xtream.of(synced)
    //
    //             .flatMap(instant -> programs(connection, instant))
    //             .optMap(this::program)
    //
    //             .collect(toSet())
    //     );
    // }
    //
    // private Stream<Focus> programs(final RepositoryConnection connection, final Instant synced) {
    //     return focus(Set.of(VIVO.AcademicDegree), connection)
    //             .inv(RDF.TYPE)
    //             .cache()
    //             .split();
    // }
    //
    // private Optional<Frame> program(final Focus focus) {
    //     return focus.value().map(program -> frame(item(Programs, Pavia, program.stringValue()))
    //
    //             .value(RDF.TYPE, Program)
    //             .value(Resources.owner, Pavia.Id)
    //
    //             .values(Schema.name, localized(focus.seq(RDFS.LABEL).values(), Pavia.Language))
    //
    //             .values(Schema.url, focus.seq(VCARD4.URL).values()
    //                     .map(Value::stringValue)
    //                     .filter(AbsoluteIRIPattern.asMatchPredicate())
    //                     .map(Values::iri)
    //             )
    //
    //             .value(Schema.educationalLevel,
    //                     focus.seq(VIVO.termType).value().map(Value::stringValue).map(DegreeToLevel::get)
    //             )
    //
    //             .values(Schema.educationalCredentialAwarded, focus.seq(VIVO.termType).values())
    //
    //             .values(Schema.assesses, localized(focus.seq(HEMO.courseObjectiveDescription).values(), Pavia.Language))
    //             .values(Schema.programPrerequisites,
    //                     localized(focus.seq(HEMO.enrollmentRequirementsDescription).values(), Pavia.Language))
    //
    //             .values(Schema.hasCourse, focus.seq(VIVO.conceptAssociatedWith).values().map(course ->
    //                     item(Courses, Pavia, course.stringValue()))
    //             )
    //
    //     );
    // }
    //
    // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // private Set<Frame> courses(final Instant synced) {
    //     return graph.query(connection -> Xtream.of(synced)
    //
    //             .flatMap(instant -> courses(connection, instant))
    //             .optMap(this::course)
    //
    //             .collect(toSet())
    //     );
    // }
    //
    // private Stream<Focus> courses(final RepositoryConnection connection, final Instant synced) {
    //     return focus(Set.of(VIVO.Course), connection)
    //             .inv(RDF.TYPE)
    //             .cache()
    //             .split();
    // }
    //
    // private Optional<Frame> course(final Focus focus) {
    //     return focus.value().map(course -> frame(item(Courses, Pavia, course.stringValue()))
    //
    //             .values(RDF.TYPE, Course)
    //             .value(Resources.owner, Pavia.Id)
    //
    //             .values(Schema.name, localized(focus.seq(RDFS.LABEL).values(), Pavia.Language))
    //
    //             .value(Schema.courseCode, focus.seq(VIVO.identifier).value())
    //
    //             .value(Schema.inLanguage, literal(focus.seq(HEMO.courseTeachingLanguage).value()
    //                     .map(Value::stringValue)
    //                     .flatMap(Languages::languageCode)
    //                     .orElse(Pavia.Language)
    //             ))
    //
    //             .values(Schema.teaches, localized(focus.seq(HEMO.courseContentsDescription).values(), Pavia.Language))
    //             .values(Schema.assesses, localized(focus.seq(HEMO.courseObjectiveDescription).values(), Pavia.Language))
    //             .values(Schema.coursePrerequisites, localized(focus.seq(HEMO.coursePrerequisitesDescription).values(), Pavia.Language))
    //
    //             .values(Schema.learningResourceType,
    //                     localized(focus.seq(HEMO.courseTeachingMethodsDescription).values(), Pavia.Language))
    //
    //             .values(Schema.competencyRequired,
    //                     localized(focus.seq(HEMO.courseAssessmentMethodsDescription).values(), Pavia.Language))
    //
    //             .decimal(Schema.numberOfCredits, focus.seq(VIVO.hasValue).value()
    //                     .flatMap(Values::integer)
    //                     .map(Offerings_::ects)
    //             )
    //
    //             .value(Schema.timeRequired, focus.seq(VIVO.dateTimeValue, RDFS.LABEL).value()
    //                     .flatMap(Values::integer)
    //                     .map(hours -> literal(String.format("PT%dH", hours), XSD.DURATION))
    //             ));
    // }


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
