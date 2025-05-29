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
import com.metreeca.flow.xml.actions.Extract;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.Locales;

import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.uri;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.programs.Program.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.universities.University.PAVIA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.util.function.Predicate.not;

public final class OfferingsPaviaDoctorates implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(OfferingsPaviaDoctorates.class.getName()));

    private static final String PAGE_URL="https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/";


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsPaviaDoctorates().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Analyzer analyzer=service(analyzer());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> store.modify(

                        array(doctorates()),

                        value(query(new ProgramFrame(true))
                                .where("university", criterion().any(PAVIA))
                                .where("pipeline", criterion().any(uri(PIPELINE)))
                        )

                )

        ).apply((elapsed, resources) -> logger.info(this, format(
                "synced <%,d> resources in <%,d> ms", resources, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Stream<ProgramFrame> doctorates() {
        return Stream.of(PAGE_URL)

                .flatMap(optional(new GET<>(new HTML())))
                .flatMap(optional(new Extract())) // !!!
                .map(new Untag())

                .flatMap(optional(analyzer.prompt("""
                        The provided markdown document contains a list of doctorate programs;
                        for each listed program extract the following properties:
                        
                        - name
                        - language as guessed from name as a 2-letter ISO tag
                        - URL
                        
                        Respond with a JSON object.
                        """, """
                        {
                          "name": "programs",
                          "strict": true,
                          "schema": {
                            "type": "object",
                            "properties": {
                              "programs": {
                                "type": "array",
                                "items": {
                                  "type": "object",
                                  "properties": {
                                    "name": {
                                      "type": "string"
                                    },
                                    "nameLanguage": {
                                      "type": "string"
                                    },
                                    "url": {
                                      "type": "string"
                                    }
                                  },
                                  "required": [
                                    "name",
                                    "nameLanguage",
                                    "url"
                                  ],
                                  "additionalProperties": false
                                }
                              }
                            },
                            "required": [
                              "programs"
                            ],
                            "additionalProperties": false
                          }
                        }
                        """
                )))

                .flatMap(json -> json.get("programs").values())

                .map(json -> async(() -> {

                    final Locale locale=json.get("nameLanguage").string()
                            .map(Locales::locale)
                            .orElse(PAVIA.locale());

                    return json.get("url").string().flatMap(url -> review(doctorate(url, new ProgramFrame()

                            .generated(true)

                            .id(PROGRAMS.id().resolve(uuid(PAVIA, url)))
                            .university(PAVIA)
                            .pipeline(PIPELINE)

                            .name(map(json.get("name").string().stream().map(name ->
                                    entry(locale, (locale.equals(PAVIA.locale()) ? "Dottorato in" : "Doctorate in ")+name)
                            )))

                            .url(set(uri(url)))

                            .educationalLevel(TopicsISCED2011.LEVEL_8)
                            .educationalCredentialAwarded(map(entry(PAVIA.locale(), "Dottorato di Ricerca"))))

                    ));

                }))

                .collect(joining())
                .flatMap(Optional::stream);
    }

    private ProgramFrame doctorate(final String url, final ProgramFrame doctorate) {
        return Optional.of(url)

                .flatMap(new GET<>(new HTML()))
                .flatMap(new Extract()) // !!!
                .map(new Untag())

                .flatMap(analyzer.prompt("""
                        Extract the following properties from the provided markdown document describing a doctoral program:
                        
                        - document language as guessed from its content as a 2-letter ISO tag
                        - general objectives
                        - acquired competency or intended learning outcomes
                        - admission requirements
                        
                        Make absolutely sure to leave empty properties that are not explicitly specified in the document.
                        Describe properties extensively, using markdown as required.
                        Respond with a JSON object.
                        """, """
                        {
                          "name": "program",
                          "strict": true,
                          "schema": {
                            "type": "object",
                            "properties": {
                              "language": {
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
                              }
                            },
                            "required": [
                              "language",
                              "objectives",
                              "competencies",
                              "requirements"
                            ],
                            "additionalProperties": false
                          }
                        }"""
                ))

                .map(value -> value)

                .map(json -> {

                    final Locale locale=json.get("language").string()
                            .map(Locales::locale)
                            .orElse(PAVIA.locale());

                    return doctorate

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
                            ));

                })

                .orElse(doctorate);
    }

}
