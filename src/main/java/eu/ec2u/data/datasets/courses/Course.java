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

package eu.ec2u.data.datasets.courses;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.meta.jsonld.*;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.shacl.Pattern;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.Resource;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.programs.Program;
import eu.ec2u.data.datasets.taxonomies.*;
import eu.ec2u.data.vocabularies.schema.SchemaCourse;
import eu.ec2u.data.vocabularies.schema.SchemaCourseInstance;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.shim.Collections.set;
import static com.metreeca.shim.Streams.nullable;

import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.Resource.localize;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.taxonomies.TopicsISCEDF2013.ISCEDF2013;
import static java.util.Comparator.comparing;
import static java.util.function.Predicate.not;


@Frame
@Class
@Namespace("[ec2u]")
public interface Course extends Resource, SchemaCourse, SchemaCourseInstance {

    static Optional<CourseFrame> review(final CourseFrame course) {

        if ( course == null ) {
            throw new NullPointerException("null course");
        }

        return Optional.of(course) // translate before English-based classification
                .map(c -> localize(c, locale -> translate(c, locale)))
                .map(c -> about(c))
                .flatMap(new Validate<>());
    }


    private static CourseFrame translate(final CourseFrame course, final Locale source) {

        final Translator translator=service(translator());

        return course // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(course.label(), source, EN)))
                .comment(Reference.comment(translator.texts(course.comment(), source, EN)))
                .name(translator.texts(course.name(), source, EN))
                .description(translator.texts(course.description(), source, EN))
                .disambiguatingDescription(translator.texts(course.disambiguatingDescription(), source, EN))
                .teaches(translator.texts(course.teaches(), source, EN))
                .assesses(translator.texts(course.assesses(), source, EN))
                .competencyRequired(translator.texts(course.competencyRequired(), source, EN))
                .educationalCredentialAwarded(translator.texts(course.educationalCredentialAwarded(), source, EN))
                .occupationalCredentialAwarded(translator.texts(course.occupationalCredentialAwarded(), source, EN))
                .coursePrerequisites(translator.texts(course.coursePrerequisites(), source, EN));
    }

    private static CourseFrame about(final CourseFrame course) {
        return course.about(Optional.ofNullable(course.about())
                .filter(not(Set::isEmpty))
                .orElseGet(() -> set(Stream.of(embeddable(course))
                        .flatMap(iscedf())
                        .limit(1)
                ))
        );
    }


    private static String embeddable(final Course course) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(course.name().get(EN)).stream(),
                Optional.ofNullable(course.description().get(EN)).stream(),
                Optional.ofNullable(course.disambiguatingDescription().get(EN)).stream(),
                Optional.ofNullable(course.teaches().get(EN)).stream()
        )));
    }


    static Taxonomies.Matcher iscedf() {
        return new Taxonomies.Matcher(ISCEDF2013)
                .narrowing(1.1)
                .tolerance(0.1);
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Map<Locale, String> label() {
        return Reference.label(name());
    }

    @Override
    default Map<Locale, String> comment() {
        return Reference.comment(disambiguatingDescription(), description());
    }


    @Override
    default Courses dataset() {
        return COURSES;
    }


    @Reverse("schema:hasCourse")
    Set<Program> inProgram();


    @Override
    @Embedded
    Organization provider();

    @Override
    @Pattern("^"+TopicsISCED2011.PATH+".*$") // !!! @Prefix
    default Topic educationalLevel() {
        return inProgram().stream()
                .flatMap(nullable(Program::educationalLevel))
                .min(comparing(Topic::id))
                .orElse(null);
    }

    @Pattern("^"+TopicsISCEDF2013.PATH+".*$") // !!! @Prefix
    Set<Topic> about();


    @Pattern("^"+TopicsEC2UStakeholders.PATH+".*$") // !!! @Prefix
    Set<Topic> audience();

}
