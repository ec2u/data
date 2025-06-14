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

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.http.handlers.Worker;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.shim.Locales;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.offerings.OfferingFrame;
import eu.ec2u.data.datasets.offerings.Offerings;
import eu.ec2u.data.datasets.organizations.Organizations;
import eu.ec2u.work.Page;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.BiFunction;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Lambdas.lenient;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.Datasets.DATASETS;
import static eu.ec2u.data.datasets.Localized.EN;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.util.function.Predicate.not;

@Frame
public interface Programs extends Dataset {

    ProgramsFrame PROGRAMS=new ProgramsFrame()
            .id(Data.DATA.resolve("programs/"))
            .isDefinedBy(Data.DATA.resolve("datasets/programs"))
            .title(map(entry(EN, "EC2U Degree and Occupational Programs")))
            .alternative(map(entry(EN, "EC2U Programs")))
            .description(map(entry(EN, """
                    Formal degree and vocational qualification programs offered by EC2U partner universities.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2022-03-10"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(PROGRAMS));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Program> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Worker().get(new Driver(new ProgramsFrame(true)

                            .members(stash(query(new ProgramFrame(true))))

                    )))

                    .path("/{code}", new Worker().get(new Driver(new ProgramFrame(true))))
            );
        }

    }

    final class Scanner implements BiFunction<Page, ProgramFrame, Optional<ProgramFrame>> {

        @Override
        public Optional<ProgramFrame> apply(final Page page, final ProgramFrame program) {
            return Optional.of(page.body())

                    .flatMap(service(analyzer()).prompt("""
                            Extract the following properties from the provided Markdown document describing an academic
                            degree program:
                            
                            - document language as guessed from its content as a 2-letter ISO tag
                            - program duration as an ISO day-based duration value (PyYMMdD, all components optional)
                            - full description of admission requirements
                            
                            Make absolutely sure to ignore properties that are not explicitly specified in the document.
                            Full descriptions must be included verbatim from the document in Markdown format
                            
                            Respond in the document original language.
                            Respond with a JSON object.
                            """, """
                            {
                              "name": "program",
                              "schema": {
                                "type": "object",
                                "properties": {
                                  "language": {
                                    "type": "string",
                                    "pattern": "^[a-z]{2}$"
                                  },
                                  "duration": {
                                    "type": "string",
                                    "pattern": "^P(\\\\d+Y)?(\\\\d+M)?(\\\\d+D)?$"
                                  },
                                  "requirements": {
                                    "type": "string"
                                  }
                                },
                                "required": [
                                  "language"
                                ],
                                "additionalProperties": false
                              }
                            }
                            """
                    ))

                    .flatMap(json -> {

                        final Locale locale=json.get("language").string()
                                .flatMap(lenient(Locales::locale))
                                .orElseGet(() -> program.university().locale());

                        return new Offerings.Scanner().apply(page, new OfferingFrame() // !!! pass program

                                .university(program.university())

                        ).flatMap(offering -> review(program

                                .id(PROGRAMS.id().resolve(uuid(program.university(), page.id().toString())))

                                .timeToComplete(json.get("duration").period().orElse(null))

                                .programPrerequisites(map(json.get("requirements").string().stream()
                                        .filter(not(String::isEmpty))
                                        .map(v -> entry(locale, v))
                                ))

                                // !!! factor

                                .generated(true)
                                .pipeline(page.pipeline())

                                .url(set(page.id()))

                                .name(offering.name())
                                .disambiguatingDescription(offering.disambiguatingDescription())

                                .numberOfCredits(offering.numberOfCredits())
                                .educationalCredentialAwarded(offering.educationalCredentialAwarded())
                                .occupationalCredentialAwarded(offering.occupationalCredentialAwarded())

                                .teaches(offering.teaches())
                                .assesses(offering.assesses())
                                .competencyRequired(offering.competencyRequired())

                                .educationalLevel(offering.educationalLevel())

                        ));

                    });
        }

    }

}
