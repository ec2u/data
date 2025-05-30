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

import com.metreeca.mesh.meta.jsonld.Frame;
import com.metreeca.shim.Locales;

import eu.ec2u.data.datasets.taxonomies.TopicsISCED2011;
import eu.ec2u.work.Page;

import java.util.Locale;
import java.util.Optional;
import java.util.function.BiFunction;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Lambdas.lenient;

import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.util.function.Predicate.not;

@Frame
public interface Offerings {

    final class Scanner implements BiFunction<Page, OfferingFrame, Optional<OfferingFrame>> {

        @Override public Optional<OfferingFrame> apply(final Page page, final OfferingFrame offering) {
            return Optional.of(page.body())

                    .flatMap(service(analyzer()).prompt("""
                            Extract the following properties from the provided Markdown document describing a university
                            educational offering (degree programs and academic, vocational or development courses):
                            
                            - document language as guessed from its content as a 2-letter ISO tag
                            - name
                            - plain text summary of about 500 characters
                            
                            - the number of ECTS credits awarded
                            - the name of the educational credential awarded
                            - the name of the occupational credential awarded
                            
                            - full description of general objectives
                            - full description of acquired competencies or intended learning outcomes
                            - full description of graduation or completion requirements
                            
                            - educational level as an ISCED 2011 code (1-9)
                            
                            Make absolutely sure to omit properties that are not explicitly specified in the document.
                            Full descriptions must be included verbatim from the document in Markdown format
                            
                            Respond in the document original language.
                            Respond with a JSON object.
                            """, """
                            {
                              "name": "offering",
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
                                  "credits": {
                                    "type": "number",
                                    "pattern": "^\\\\d+\\\\.\\\\d$"
                                  },
                                  "educationalCredential": {
                                    "type": "string"
                                  },
                                  "occupationalCredential": {
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
                                  }
                                },
                                "required": [
                                  "language",
                                  "name",
                                  "summary",
                                  "objectives",
                                  "competencies"
                                ],
                                "additionalProperties": false
                              }
                            }"""
                    ))

                    .map(json -> {

                        final Locale locale=json.get("language").string()
                                .flatMap(lenient(Locales::locale))
                                .orElseGet(() -> offering.university().locale());

                        return offering

                                .generated(true)
                                .pipeline(page.pipeline())

                                .url(set(page.id()))

                                .name(json.get("name").string()
                                        .map(name -> map(entry(locale, name)))
                                        .orElse(null)
                                )

                                .disambiguatingDescription(json.get("summary").string()
                                        .map(summary -> map(entry(locale, summary)))
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

                                .competencyRequired(map(json.get("requirements").string().stream()
                                        .filter(not(String::isEmpty))
                                        .map(v -> entry(locale, v))
                                ))

                                .educationalLevel(json.get("level").number()
                                        .map(Number::intValue)
                                        .map(v -> Math.max(1, Math.min(9, v)))
                                        .map(TopicsISCED2011::level)
                                        .orElse(null)
                                );

                    });
        }

    }

}
