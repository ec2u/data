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
import com.metreeca.flow.xml.actions.Focus;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.mesh.Value;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.programs.Program;
import eu.ec2u.data.datasets.programs.ProgramFrame;
import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.data.vocabularies.schema.SchemaEducationalOccupationalCredentialFrame;
import eu.ec2u.work.PageKeeper;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.services.Logger.logger;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Loggers.time;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.offerings.Offering.review;
import static eu.ec2u.data.datasets.programs.Programs.PROGRAMS;
import static eu.ec2u.data.datasets.universities.University.PAVIA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.data.vocabularies.schema.SchemaEducationalOccupationalCredential.CredentialCategory.Degree;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.lang.String.format;
import static java.util.function.Predicate.not;
import static java.util.stream.Collectors.toMap;

public final class OfferingsPaviaDoctorates implements Runnable {

    private static final URI PIPELINE=uri("java:%s".formatted(OfferingsPaviaDoctorates.class.getName()));

    private static final String PAGE_URL="https://phd.unipv.it/la-scuola-di-alta-formazione-dottorale-di-pavia-safd/";

    private static final int BATCH=10; // pages fetched concurrently and committed as a single checkpoint
    private static final int RETRIES=3;

    private static final Duration TTL=Duration.ofDays(30);
    private static final Duration BUDGET=Duration.ofSeconds(30); // leaves room for the last batch to complete


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new OfferingsPaviaDoctorates().sync(Optional.empty())); // no budget: drain the queue
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());
    private final Logger logger=service(logger());


    @Override
    public void run() {
        sync(Optional.of(BUDGET));
    }


    private void sync(final Optional<Duration> budget) {

        final Map<URI, ProgramFrame> seeds=seeds();

        final PageKeeper<ProgramFrame> keeper=new PageKeeper<ProgramFrame>(PIPELINE)

                .batch(BATCH)
                .retries(RETRIES)
                .ttl(TTL)

                .insert(page -> Optional.ofNullable(seeds.get(page.id()))
                        .map(seed -> doctorate(page.body(), seed))
                        .flatMap(Program::review)
                )

                .remove(page -> Optional.of(new ProgramFrame(true).id(page.resource())));

        time(() -> budget

                .map(keeper::budget)
                .orElse(keeper)

                .apply(seeds.keySet())

        ).apply((elapsed, values) -> logger.info(this, format(
                "synced <%,d> values in <%,d> ms", values, elapsed
        )));
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Lists the doctorate pages advertised by the school index, seeded with the properties reported by the index
     * itself.
     */
    private Map<URI, ProgramFrame> seeds() {
        return Stream.of(PAGE_URL)

                .flatMap(optional(new GET<>(new HTML())))
                .flatMap(optional(new Focus())) // !!!
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
                .flatMap(json -> seed(json).stream())

                .collect(toMap(Entry::getKey, Entry::getValue, (x, y) -> x));
    }

    private Optional<Entry<URI, ProgramFrame>> seed(final Value json) {
        return json.get("url").string()

                .flatMap(lenient(URIs::uri))

                .map(url -> {

                    final Locale locale=json.get("nameLanguage").string()
                            .map(Locales::locale)
                            .orElse(PAVIA.locale());

                    return entry(url, new ProgramFrame()

                            .generated(true)

                            .id(PROGRAMS.id().resolve(uuid(PAVIA, url.toString())))
                            .university(PAVIA)
                            .pipeline(PIPELINE)

                            .name(map(json.get("name").string().stream().map(name ->
                                    entry(locale, (locale.equals(PAVIA.locale()) ? "Dottorato in" : "Doctorate in ")+name)
                            )))

                            .url(set(url))

                            .educationalLevel(set(TopicsISCED2011.LEVEL_8))
                            .educationalCredentialAwarded(review(PAVIA.locale(),
                                    new SchemaEducationalOccupationalCredentialFrame()
                                            .credentialCategory(Degree)
                                            .name(map(entry(PAVIA.locale(), "Dottorato di Ricerca")))
                            ).orElse(null))

                    );

                });
    }

    private ProgramFrame doctorate(final String body, final ProgramFrame doctorate) {
        return Optional.of(body)

                .flatMap(analyzer.prompt("""
                        Extract the following properties from the provided markdown document describing a doctoral program:

                        - document language as guessed from its content as a 2-letter ISO tag
                        - plain text summary of about 500 characters
                        - goals, structure and contents
                        - acquired competency or intended learning outcomes
                        - admission requirements
                        - graduation or completion requirements

                        Make absolutely sure to leave empty properties that are not explicitly specified in the document.
                        Describe properties extensively, using markdown as required.
                        Respond with a JSON object.
                        """, """
                        {
                          "name": "program",
                          "schema": {
                            "type": "object",
                            "properties": {
                              "language": {
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
                              "graduation": {
                                "type": "string"
                              }
                            },
                            "required": [
                              "language",
                              "summary",
                              "objectives",
                              "competencies",
                              "requirements"
                            ],
                            "additionalProperties": false
                          }
                        }"""
                ))

                .map(json -> {

                    final Locale locale=json.get("language").string()
                            .map(Locales::locale)
                            .orElse(PAVIA.locale());

                    return doctorate

                            .disambiguatingDescription(json.get("summary").string()
                                    .map(summary -> map(entry(locale, summary)))
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

                            .competencyRequired(map(json.get("graduation").string().stream()
                                    .filter(not(String::isEmpty))
                                    .map(v -> entry(locale, v))
                            ));

                })

                .orElse(doctorate);
    }

}
