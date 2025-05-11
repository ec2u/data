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

import com.metreeca.flow.Xtream;
import com.metreeca.flow.json.actions.Validate;
import com.metreeca.flow.text.services.Translator;
import com.metreeca.mesh.meta.jsonld.Class;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.mesh.meta.jsonld.Namespace;

import eu.ec2u.data.resources.Reference;
import eu.ec2u.data.resources.Resource;
import eu.ec2u.data.resources.Resources;
import eu.ec2u.data.taxonomies.EuroSciVoc;
import eu.ec2u.data.taxonomies.TopicFrame;
import eu.ec2u.data.things.SchemaThing;
import eu.ec2u.work.ai.Embedder;

import java.util.Locale;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.text.services.Translator.translator;
import static com.metreeca.shim.Collections.set;

import static eu.ec2u.data.programs.Programs.PROGRAMS;
import static eu.ec2u.data.resources.Localized.EN;


@Frame
@Class
@Namespace("[ec2u]")
public interface Program extends Resource, SchemaEducationalOccupationalProgram {

    double ABOUT_THRESHOLD=0.6;


    static Optional<ProgramFrame> review(final ProgramFrame program, final Locale source) {

        if ( program == null ) {
            throw new NullPointerException("null program");
        }

        if ( source == null ) {
            throw new NullPointerException("null source");
        }

        return Optional.of(program)
                .map(u -> translate(u, source)) // before English-based classification
                .map(Program::classify)
                .flatMap(new Validate<>());
    }


    private static ProgramFrame translate(final ProgramFrame program, final Locale source) {

        final Translator translator=service(translator());

        return program // translate also customized labels/comments ;(translated text must be clipped again)
                .label(Reference.label(translator.texts(program.label(), source, EN)))
                .comment(Reference.comment(translator.texts(program.comment(), source, EN)))
                .name(SchemaThing.name(translator.texts(program.name(), source, EN)))
                .description(SchemaThing.description(translator.texts(program.description(), source, EN)))
                .disambiguatingDescription(SchemaThing.disambiguatingDescription(translator.texts(program.disambiguatingDescription(), source, EN)));
    }

    private static ProgramFrame classify(final ProgramFrame program) {
        return program.about().isEmpty() ? program.about(set(Resources
                .match(EuroSciVoc.EUROSCIVOC.id(), embeddable(program), ABOUT_THRESHOLD)
                .map(uri -> new TopicFrame(true).id(uri))
                .limit(1)
        )) : program;
    }

    private static String embeddable(final Program program) {
        return Embedder.embeddable(set(Xtream.from(
                Optional.ofNullable(program.name().get(EN)).stream(),
                Optional.ofNullable(program.description().get(EN)).stream(),
                Optional.ofNullable(program.disambiguatingDescription().get(EN)).stream(),
                Optional.ofNullable(program.teaches().get(EN)).stream()
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Programs collection() {
        return PROGRAMS;
    }

}
