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

import com.metreeca.flow.http.handlers.Delegator;
import com.metreeca.flow.http.handlers.Router;
import com.metreeca.flow.json.handlers.Driver;
import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.shim.Collections;
import com.metreeca.shim.Locales;

import eu.ec2u.data.Data;
import eu.ec2u.data.datasets.Dataset;
import eu.ec2u.data.datasets.Datasets;
import eu.ec2u.data.datasets.events.Event;
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
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.util.function.Predicate.not;

@Frame
public interface Courses extends Dataset {

    CoursesFrame COURSES=new CoursesFrame()
            .id(Data.DATA.resolve("courses/"))
            .isDefinedBy(Data.DATA.resolve("datasets/courses"))
            .title(map(entry(EN, "EC2U Academic and Occupational Courses")))
            .alternative(map(entry(EN, "EC2U Courses")))
            .description(map(entry(EN, """
                    Degree, vocational and personal development courses offered by EC2U partner universities.
                    """)))
            .publisher(Organizations.EC2U)
            .rights(Datasets.COPYRIGHT)
            .license(set(Datasets.CCBYNCND40))
            .issued(LocalDate.parse("2022-03-10"));


    static void main(final String... args) {
        exec(() -> service(store()).insert(COURSES));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    @Override
    default Datasets dataset() {
        return DATASETS;
    }

    @Override
    Set<Course> members();


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    final class Handler extends Delegator {

        public Handler() {
            delegate(new Router()

                    .path("/", new Driver().retrieve(new CoursesFrame(true)

                            .members(stash(query(new CourseFrame(true))))

                    ))

                    .path("/{code}", new Driver().retrieve(new CourseFrame(true)))
            );
        }

    }

    final class Scanner implements BiFunction<Page, CourseFrame, Optional<CourseFrame>> {

        @Override
        public Optional<CourseFrame> apply(final Page page, final CourseFrame course) {
            return Optional.of(page.body())

                    .flatMap(service(analyzer()).prompt("""
                            Extract the following properties from the provided Markdown document describing an academic,
                            vocational or personal development course:
                            
                            - document language as guessed from its content as a 2-letter ISO tag
                            - course teaching language as stated in thedocument as a 2-letter ISO tag
                            - course code
                            - course duration as an ISO day-time-based duration value (PdDThHmM, all components optional)
                            - course study workload as an ISO day-time-based duration value (PdDThHmM, all components optional)
                            - course tuition fees (free/paid)
                            - course attendance mode (offline/online/mixed)\s
                            - full description of admission requirements
                            
                            Make absolutely sure to ignore properties that are not explicitly specified in the document.
                            Full descriptions must be included verbatim from the provided document in Markdown format
                            
                            Respond in the document original language.
                            Respond with a JSON object.
                            """, """
                            {
                              "name": "course",
                              "schema": {
                                "type": "object",
                                "properties": {
                                  "language": {
                                    "type": "string",
                                    "pattern": "^[a-z]{2}$"
                                  },
                                  "teaching": {
                                    "type": "string",
                                    "pattern": "^[a-z]{2}$"
                                  },
                                  "code": {
                                    "type": "string"
                                  },
                                  "duration": {
                                    "type": "string",
                                    "pattern": "^P(\\\\d+D)?(T(\\\\d+H)?(\\\\d+M)?)?$"
                                  },
                                  "workload": {
                                    "type": "string",
                                    "pattern": "^P(\\\\d+D)?(T(\\\\d+H)?(\\\\d+M)?)?$"
                                  },
                                  "fees": {
                                    "type": "string",
                                    "enum": [
                                      "free",
                                      "paid"
                                    ]
                                  },
                                  "mode": {
                                    "type": "string",
                                    "enum": [
                                      "offline",
                                      "online",
                                      "mixed"
                                    ]
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
                            }"""
                    ))

                    .flatMap(json -> {

                        final Locale locale=json.get("language").string()
                                .flatMap(lenient(Locales::locale))
                                .orElseGet(() -> course.university().locale());

                        return new Offerings.Scanner().apply(page, new OfferingFrame() // !!! pass course

                                .university(course.university())

                        ).flatMap(offering -> Course.review(course

                                .id(COURSES.id().resolve(uuid(course.university(), page.id().toString())))

                                .courseCode(json.get("code").string().orElse(null))

                                .timeRequired(json.get("duration").duration().orElse(null))
                                .courseWorkload(json.get("workload").duration().orElse(null))

                                .inLanguage(json.get("teaching").string()
                                        .map(Collections::set)
                                        .orElse(null)
                                )

                                .isAccessibleForFree(json.get("fees").string().map(Event::entryFees).orElse(null))
                                .courseMode(json.get("attendance").string().map(Event::attendanceMode).orElse(null))

                                .coursePrerequisites(map(json.get("requirements").string().stream()
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
