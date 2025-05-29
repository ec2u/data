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

package eu.ec2u.data.datasets.programs;

import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Embedded;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;
import com.metreeca.mesh.meta.shacl.Pattern;

import eu.ec2u.data.datasets.Reference;
import eu.ec2u.data.datasets.offerings.Offering;
import eu.ec2u.data.datasets.organizations.Organization;
import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.data.datasets.taxonomies.TopicsISCEDF2013;
import eu.ec2u.data.vocabularies.schema.SchemaEducationalOccupationalProgram;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.shim.Collections.set;

import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.Resource.localize;
import static eu.ec2u.data.datasets.offerings.Offering.*;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static java.util.function.Predicate.not;


@Frame
@Class
@Namespace("[ec2u]")
public interface Program extends Offering, SchemaEducationalOccupationalProgram {

    static Optional<ProgramFrame> review(final ProgramFrame program) {

        if ( program == null ) {
            throw new NullPointerException("null program");
        }

        return Optional.of(program) // translate before English-based classification
                .map(p -> localize(p, locale -> translate(p, locale)))
                .map(p -> educationalLevel(p))
                .map(p -> about(p))
                .flatMap(new Validate<>());
    }


    private static ProgramFrame translate(final ProgramFrame program, final Locale source) {

        final Translator translator=service(translator());

        return program // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(program.label(), source, EN)))
                .comment(Reference.comment(translator.texts(program.comment(), source, EN)))
                .name(translator.texts(program.name(), source, EN))
                .description(translator.texts(program.description(), source, EN))
                .disambiguatingDescription(translator.texts(program.disambiguatingDescription(), source, EN))
                .teaches(translator.texts(program.teaches(), source, EN))
                .assesses(translator.texts(program.assesses(), source, EN))
                .competencyRequired(translator.texts(program.competencyRequired(), source, EN))
                .educationalCredentialAwarded(translator.texts(program.educationalCredentialAwarded(), source, EN))
                .occupationalCredentialAwarded(translator.texts(program.occupationalCredentialAwarded(), source, EN))
                .programPrerequisites(translator.texts(program.programPrerequisites(), source, EN));
    }


    static ProgramFrame educationalLevel(final ProgramFrame offering) {
        return offering.educationalLevel(Optional.ofNullable(offering.educationalLevel())
                .or(() -> Optional.of(embeddable(offering)).stream()
                        .flatMap(isced2011())
                        .findFirst()
                )
                .orElse(null)
        );
    }

    static ProgramFrame about(final ProgramFrame program) {
        return program.about(Optional.ofNullable(program.about())
                .filter(not(Set::isEmpty))
                .orElseGet(() -> set(Stream.of(embeddable(program))
                        .flatMap(iscedf())
                        .limit(1)
                ))
        );
    }



    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Programs dataset() {
        return PROGRAMS;
    }


    //̸// !!! Factor to Offering ///////////////////////////////////////////////////////////////////////////////////////

    @Override
    @Embedded
    Organization provider();

    @Pattern("^"+TopicsISCED2011.PATH+".*$") // !!! @Prefix
    Topic educationalLevel();

    @Pattern("^"+TopicsISCEDF2013.PATH+".*$") // !!! @Prefix
    Set<Topic> about();

}
