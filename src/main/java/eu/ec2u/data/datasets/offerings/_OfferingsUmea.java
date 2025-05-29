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

import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
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
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.universities.University.UMEA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.collectingAndThen;
import static java.util.stream.Collectors.toSet;

public final class _OfferingsUmea implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(_OfferingsUmea.class.getName()));


    public static void main(final String... args) {
        exec(() -> new _OfferingsUmea().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Logger logger=service(logger());
    private final Executor executor=executor(25);

    // !!! factor w/ OfferingsPaviaDoctorates/Schools

    private final Analyzer program=service(analyzer()).prompt("""
            Extract the following properties from the provided markdown document describing a university degree program:
            
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

        // programs()
        //         .limit(1)
        //         .flatMap(url -> Optional.of(url)
        //
        //                 .map(URI::toString)
        //                 .flatMap(new GET<>(new HTML()))
        //                 .map(new Untag())
        //
        //                 .flatMap(body -> program(url, body))
        //                 .stream()
        //
        //
        //         )
        //         .forEach(System.out::println);

        // programs().collect(collectingAndThen(toSet(), urls -> {
        //
        //     System.out.println("processing %d urls".formatted(urls.size()));
        //
        //     urls.stream()
        //
        //             .map(url -> async(executor, () -> Stream.of(url)
        //
        //                     .map(u -> {
        //
        //                         System.out.printf("%s submitted%n", u);
        //
        //                         try {
        //                             Thread.sleep(2000);
        //                         } catch ( final InterruptedException e ) {
        //
        //                         }
        //
        //                         System.out.printf("%s completed%n", url);
        //
        //                         return url;
        //
        //                     })
        //
        //                     .toList()
        //
        //             ))
        //
        //             .collect(joining())
        //             .flatMap(Collection::stream)
        //             .forEach(System.out::println);
        //
        //     return urls;
        //
        // }));

        time(() -> programs().collect(collectingAndThen(toSet(), new PageKeeper<>(

                PIPELINE,
                this::program,
                id -> new ProgramFrame(true).id(id),
                executor

        )))).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<URI> programs() {
        return Stream

                .of("https://www.umu.se/utbildning/sok/?edu=p")

                .flatMap(traverse(

                        url -> Stream.of(url)
                                .flatMap(optional(new GET<>(new HTML())))
                                .map(XPath::new),

                        path -> path.links("//ul[@class='pagination text-center']//a/@href"),
                        path -> path.links("//a[contains(@class,'eduName')]/@href")

                ))

                .flatMap(optional(lenient(URIs::uri)));
    }

    private Optional<ProgramFrame> program(final URI url, final String body) {
        return Optional.of(body).flatMap(program).flatMap(json -> {

            final Locale locale=json.get("language").string()
                    .flatMap(lenient(Locales::locale))
                    .orElseGet(UMEA::locale);

            return review(new ProgramFrame()

                    .generated(true)

                    .id(PROGRAMS.id().resolve(uuid(UMEA, url.toString())))
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

                    .educationalLevel(json.get("level").number()
                            .map(Number::intValue)
                            .map(v -> Math.max(1, Math.min(9, v)))
                            .map(TopicsISCED2011::level)
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

                    .programPrerequisites(map(json.get("requirements").string().stream()
                            .filter(not(String::isEmpty))
                            .map(v -> entry(locale, v))
                    ))

            );

        });
    }

}
