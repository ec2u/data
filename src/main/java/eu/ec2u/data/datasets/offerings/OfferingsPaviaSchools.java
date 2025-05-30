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
import com.metreeca.mesh.Value;
import com.metreeca.mesh.tools.Store;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
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

public final class OfferingsPaviaSchools implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(OfferingsPaviaSchools.class.getName()));


    private static final Collection<String> ROOT_URLS=list(
            "https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-medici",
            "https://portale.unipv.it/it/didattica/post-laurea/scuole-di-specializzazione/scuole-di-specializzazione-di-area-sanitaria/scuole-di-specializzazione-laureati-non-medici"
    );


    public static void main(final String... args) {
        exec(() -> new OfferingsPaviaSchools().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Store store=service(store());
    private final Analyzer analyzer=service(analyzer());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        time(() -> store.modify(

                        array(schools()),

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

    private Stream<ProgramFrame> schools() { // !!! migrate to Programs.Scanner
        return ROOT_URLS.stream()

                .map(url -> async(() -> Stream.of(url)

                        .flatMap(optional(new GET<>(new HTML())))
                        .flatMap(optional(new Extract()))
                        .map(new Untag())

                        .flatMap(optional(analyzer.prompt("""
                                The provided markdown document describes a list of specialisation schools;
                                for each listed school extract the following properties:
                                
                                - name
                                - general objectives
                                - acquired competency or intended learning outcomes
                                - admission requirements
                                
                                Make absolutely sure to leave empty properties that are not explicitly specified in the document.
                                Describe properties extensively.
                                Respond as a JSON object
                                """, """
                                {
                                  "name": "schools",
                                  "strict": false,
                                  "schema": {
                                    "type": "object",
                                    "properties": {
                                      "schools": {
                                        "type": "array",
                                        "items": {
                                          "type": "object",
                                          "properties": {
                                            "name": {
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
                                            "name"
                                          ]
                                        }
                                      }
                                    },
                                    "required": [
                                      "schools"
                                    ]
                                  }
                                }
                                """
                        )))

                        .flatMap(json -> json.get("schools").values())

                        .map(school -> async(() -> school(school)))

                        .collect(joining())
                        .flatMap(Optional::stream)
                        .toList()

                ))

                .collect(joining())
                .flatMap(Collection::stream);
    }


    private Optional<ProgramFrame> school(final Value json) {
        return json.get("name").string()
                .map("Scuola di Specializzazione in %s"::formatted)
                .flatMap(name -> review(new ProgramFrame()

                        .generated(true)

                        .id(PROGRAMS.id().resolve(uuid(PAVIA, name)))
                        .university(PAVIA)
                        .pipeline(PIPELINE)

                        .url(set(json.get("url").string().flatMap(URIs::fuzzy).stream()))

                        .name(map(entry(PAVIA.locale(), name)))

                        .educationalLevel(TopicsISCED2011.LEVEL_8)
                        .educationalCredentialAwarded(map(entry(PAVIA.locale(), "Diploma di Specializzazione")))

                        .teaches(map(teaches(json)))
                        .assesses(map(assesses(json)))
                        .programPrerequisites(map(programPrerequisites(json)))


                ));
    }


    private Stream<Map.Entry<Locale, String>> teaches(final Value json) {
        return json.get("objectives").string()
                .filter(not(String::isEmpty))
                .map(v -> entry(PAVIA.locale(), v))
                .stream();
    }

    private Stream<Map.Entry<Locale, String>> assesses(final Value json) {
        return json.get("competencies").string()
                .filter(not(String::isEmpty))
                .map(v -> entry(PAVIA.locale(), v))
                .stream();
    }

    private Stream<Map.Entry<Locale, String>> programPrerequisites(final Value json) {
        return json.get("requirements").string()
                .filter(not(String::isEmpty))
                .map(v -> entry(PAVIA.locale(), v))
                .stream();
    }

}
