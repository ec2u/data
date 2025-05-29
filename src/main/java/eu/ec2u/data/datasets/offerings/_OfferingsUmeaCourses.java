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

package eu.ec2u.data.datasets.offerings;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.services.Logger;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.courses.CourseFrame;
import eu.ec2u.work.PageKeeper;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.executor;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.Streams.traverse;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.courses.Course.review;
import static eu.ec2u.data.datasets.courses.Courses.COURSES;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;

public final class _OfferingsUmeaCourses implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(_OfferingsUmeaCourses.class.getName()));


    public static void main(final String... args) {
        exec(() -> new _OfferingsUmeaCourses().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());
    private final Executor executor=executor(25);

    private final Analyzer course=service(analyzer()).prompt("""
            Extract the following properties from the provided markdown document describing a university course:
            
            - document language as guessed from its content as a 2-letter ISO tag
            - name
            - plain text summary of about 500 characters
            - full description of general objectives, as included in the document and in markdown format
            - full description of acquired competencies or intended learning outcomes, as included in the document and in markdown format
            - full description of admission requirements, as included in the document and in markdown format
            - educational level as an ISCED 2011 code (1-9)
            - the number of ECTS credits awarded
            - the name of the educational credential awarded
            - the name of the occupational credential awarded
            
            Make absolutely sure to leave empty properties that are not explicitly specified in the document.
            
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
                      "pattern": "^[a-zA-Z]{2}$"
                    },
                    "name": {
                      "type": "string"
                    },
                    "summary": {
                      "type": "string"
                    },
                    "objectives": {
                      "type": "string"
                    },
                    "competencies": {
                      "type": "string"
                    },
                    "requirements": {
                      "type": "string"
                    },
                    "level": {
                      "type": "number",
                      "pattern": "^\\\\d$"
                    },
                    "credits": {
                      "type": "number",
                      "pattern": "^\\\\d+\\\\.\\\\d$"
                    },
                    "educationalCredential": {
                      "type": "string"
                    },
                    "occupationalCredential": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "language",
                    "name",
                    "summary",
                    "objectives",
                    "competencies",
                    "requirements"
                  ],
                  "additionalProperties": false
                }
            }"""
    );


    @Override
    public void run() {
        time(() -> courses()

                .sorted()
                .skip(0)
                .limit(250)

                .collect(collectingAndThen(toSet(), new PageKeeper<>(

                PIPELINE,
                this::course,
                id -> new CourseFrame(true).id(id),
                executor

        )))).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<URI> courses() {
        return Stream

                .of("https://www.umu.se/utbildning/sok/?edu=c")

                .flatMap(traverse(

                        url -> Stream.of(url)
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new),

                        path -> path.links("//ul[@class='pagination text-center']//a/@href"),
                        path -> path.links("//a[contains(@class,'eduName')]/@href")

                ))

                .flatMap(optional(lenient(URIs::uri)));
    }

    private Optional<CourseFrame> course(final URI url, final String body) {
        return Optional.of(body).flatMap(course).flatMap(json -> {

            final Locale locale=json.get("language").string()
                    .flatMap(lenient(Locales::locale))
                    .orElseGet(UMEA::locale);

            return review(new CourseFrame()

                    .generated(true)

                    .id(COURSES.id().resolve(uuid(UMEA, url.toString())))
                    .university(UMEA)
                    .pipeline(PIPELINE)

                    .comment(json.get("summary").string()
                            .map(summary -> map(entry(locale, summary)))
                            .orElse(null)
                    )

                    .url(set(url))

                    .name(json.get("name").string()
                            .map(name -> map(entry(locale, name)))
                            .orElse(null)
                    )

                    .numberOfCredits(json.get("credits").number()
                            .map(Number::doubleValue)
                            .map(v -> Math.round(v*2.0)/2.0) // round to nearest 0.5
                            .orElse(null)
                    )

                    .educationalCredentialAwarded(json.get("educationalCredential").string()
                            .map(name -> map(entry(locale, name)))
                            .orElse(null)
                    )

                    .occupationalCredentialAwarded(json.get("occupationalCredential").string()
                            .map(name -> map(entry(locale, name)))
                            .orElse(null)
                    )

                    .teaches(map(json.get("objectives").string().stream()
                            .filter(not(String::isEmpty))
                            .map(v -> entry(locale, v))
                    ))

                    .assesses(map(json.get("competencies").string().stream()
                            .filter(not(String::isEmpty))
                            .map(v -> entry(locale, v))
                    ))

                    .coursePrerequisites(map(json.get("requirements").string().stream()
                            .filter(not(String::isEmpty))
                            .map(v -> entry(locale, v))
                    ))

            );

        });
    }

}
