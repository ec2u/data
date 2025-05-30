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

package eu.ec2u.data.datasets.units;

import com.metreeca.flow.Xtream;
import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.shim.Locales;
import com.metreeca.shim.URIs;

import eu.ec2u.data.datasets.taxonomies.Topic;
import eu.ec2u.data.datasets.taxonomies.TopicsEC2UOrganizations;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static com.metreeca.flow.Locator.async;
import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.Value.value;
import static com.metreeca.mesh.queries.Criterion.criterion;
import static com.metreeca.mesh.queries.Query.query;
import static com.metreeca.shim.Collections.*;
import static com.metreeca.shim.Futures.joining;
import static com.metreeca.shim.Lambdas.lenient;
import static com.metreeca.shim.Streams.optional;
import static com.metreeca.shim.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.datasets.units.Unit.review;
import static eu.ec2u.data.datasets.universities.University.PAVIA;
import static eu.ec2u.data.datasets.universities.University.uuid;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;
import static java.util.function.UnaryOperator.identity;

public final class UnitsPavia implements Runnable {

    private record Catalog(
            URI url,
            Topic classification
    ) { }


    public static void main(final String... args) {
        exec(() -> new UnitsPavia().run());
    }


    /// ̸//////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        service(store()).modify(

                array(list(Stream

                        .of(
                                new Catalog(
                                        uri("https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti"),
                                        TopicsEC2UOrganizations.DEPARTMENT
                                ),
                                new Catalog(
                                        uri("https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo"),
                                        TopicsEC2UOrganizations.SERVICE_CENTRE
                                ),
                                new Catalog(
                                        uri("https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali"),
                                        TopicsEC2UOrganizations.INTERDEPARTMENTAL_RESEARCH_CENTRE
                                )
                        )

                        .map(catalog -> async(() -> catalog(catalog)
                                .map(unit -> async(() -> details(unit)))
                                .collect(joining())
                                .flatMap(identity())
                        ))

                        .collect(joining())
                        .flatMap(identity())

                )),

                value(query(new UnitFrame(true)).where("university", criterion().any(PAVIA)))

        );
    }


    private Stream<UnitFrame> catalog(final Catalog catalog) { // !!! migrate to Units.Scanner
        return Xtream.of(catalog.url().toASCIIString())

                .optMap(new GET<>(new HTML()))
                .map(new Untag())

                .optMap(analyzer.prompt("""
                        The input is a markdown document containing a list of university research units;
                        for each unit in the list, extract the following properties :
                        
                        - complete name (don't include the acronym)
                        - name language as a 2-letter ISO tag
                        - uppercase acronym (only if explicitly defined in the complete name, ignoring the URL)
                        - URL (optional)
                        
                        Make absolutely sure to report all units included in the list.
                        Don't include empty properties.
                        Respond with a JSON object.
                        """, """
                        {
                          "name": "units",
                          "schema": {
                            "type": "object",
                            "properties": {
                              "units": {
                                "type": "array",
                                "items": {
                                  "type": "object",
                                  "properties": {
                                    "acronym": {
                                      "type": "string"
                                    },
                                    "name": {
                                      "type": "string"
                                    },
                                    "language": {
                                      "type": "string",
                                      "pattern": "^\\\\d{2}$"
                                    },
                                    "url": {
                                      "type": "string",
                                      "format": "uri"
                                    }
                                  },
                                  "required": [
                                    "name",
                                    "language"
                                  ]
                                }
                              }
                            },
                            "required": [
                              "units"
                            ]
                          }
                        }
                        """
                ))

                .flatMap(json -> json.select("units.*").values())

                .flatMap(optional(json -> {

                    final Optional<URI> url=json.get("url").string()
                            .flatMap(URIs::fuzzy)
                            .map(catalog.url()::resolve);

                    return url.map(URI::toString)
                            .or(() -> json.get("name").string())

                            .map(id -> new UnitFrame()

                                    .generated(true)

                                    .id(Units.UNITS.id().resolve(uuid(PAVIA, id)))

                                    .university(PAVIA)
                                    .unitOf(set(PAVIA))

                                    .altLabel(json.get("acronym").string()
                                            .map(acronym -> map(entry(ROOT, acronym)))
                                            .orElse(null)
                                    )

                                    .prefLabel(json.get("name").string()
                                            .flatMap(name -> json.get("language").string()
                                                    .flatMap(lenient(Locales::locale))
                                                    .map(locale -> map(entry(locale, name)))
                                            )
                                            .orElse(null)
                                    )

                                    .homepage(set(url.stream()))

                                    .classification(set(catalog.classification()))

                            );

                }));
    }

    private Stream<UnitFrame> details(final UnitFrame unit) {
        return review(

                unit.homepage().stream().findFirst()

                        .map(URI::toASCIIString)
                        .flatMap(new GET<>(new HTML()))
                        .map(new Untag())

                        .flatMap(analyzer.prompt("""
                                Extract the following properties from the provided markdown document
                                describing a university research unit:
                                
                                - acronym (don't include if not explicitly defined in the document)
                                - plain text summary of about 500 characters in the document language
                                - full description as included in the document in markdown format
                                - document language as a 2-letter ISO tag
                                
                                Remove personal email addresses.
                                Respond with a JSON object.
                                """, """
                                {
                                  "name": "unit",
                                  "schema": {
                                    "type": "object",
                                    "properties": {
                                      "acronym": {
                                        "type": "string"
                                      },
                                      "summary": {
                                        "type": "string"
                                      },
                                      "description": {
                                        "type": "string"
                                      },
                                      "language": {
                                        "type": "string",
                                        "pattern": "^[a-zA-Z]{2}$"
                                      }
                                    },
                                    "required": []
                                  }
                                }
                                """
                        ))

                        .flatMap(json -> json.get("language").string()
                                .flatMap(lenient(Locales::locale))
                                .map(locale -> unit

                                        .altLabel(Optional.of(unit.altLabel())
                                                .filter(not(Map::isEmpty))
                                                .or(() -> json.get("acronym").string()
                                                        .map(acronym -> map(entry(ROOT, acronym)))
                                                )
                                                .orElse(null)
                                        )

                                        .altLabel(json.get("acronym").string()
                                                .map(acronym -> map(entry(ROOT, acronym)))
                                                .orElse(null)
                                        )

                                        .comment(json.get("summary").string()
                                                .map(summary -> map(entry(locale, summary)))
                                                .orElse(null)
                                        )

                                        .definition(json.get("description").string()
                                                .map(description -> map(entry(locale, description)))
                                                .orElse(null)
                                        )

                                )
                        )

                        .orElse(unit)

        ).stream();
    }

}
