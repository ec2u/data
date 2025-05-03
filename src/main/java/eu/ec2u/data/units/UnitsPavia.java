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

package eu.ec2u.data.units;

import com.metreeca.flow.http.actions.GET;
import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;

import eu.ec2u.data.taxonomies.EC2UOrganizations;
import eu.ec2u.data.taxonomies.Topic;
import eu.ec2u.data.universities.University;
import eu.ec2u.work.Parsers;
import eu.ec2u.work.ai.Analyzer;

import java.net.URI;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.formats.JSON.store;
import static com.metreeca.flow.rdf.Values.guarded;
import static com.metreeca.mesh.Value.array;
import static com.metreeca.mesh.util.Collections.*;
import static com.metreeca.mesh.util.URIs.uri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.units.Unit.review;
import static eu.ec2u.work.ai.Analyzer.analyzer;
import static java.util.Locale.ROOT;
import static java.util.Map.entry;
import static java.util.function.Predicate.not;

public final class UnitsPavia implements Runnable {

    private static final URI CONTEXT=Units.UNITS.id().resolve("pavia");


    private record Catalog(
            URI url,
            Topic classification
    ) { }


    //̸// !!! //////////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final Pattern LanguagePattern=Pattern.compile("[a-zA-Z]{2}");

    private static Optional<Locale> locale(final Optional<String> locale) {
        return locale
                .filter(LanguagePattern.asMatchPredicate())
                .map(guarded(Locale::forLanguageTag));
    }


    /// ̸//////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new UnitsPavia().run());
    }


    /// ̸//////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        service(store()).partition(CONTEXT).clear().insert(array(list(Xtream

                .of(
                        new Catalog(
                                uri("https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti"),
                                EC2UOrganizations.DEPARTMENT
                        ),
                        new Catalog(
                                uri("https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo"),
                                EC2UOrganizations.SERVICE_CENTRE
                        ),
                        new Catalog(
                                uri("https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali"),
                                EC2UOrganizations.INTERDEPARTMENTAL_RESEARCH_CENTRE
                        )
                )

                .flatMap(this::catalog)
                .map(this::details)
                .optMap(unit -> review(unit, University.PAVIA.locale()))

        )));
    }


    /// ̸//////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<UnitFrame> catalog(final Catalog catalog) {
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


                .map(json -> {

                            final Optional<URI> url=json.get("url").string()
                                    .flatMap(Parsers::uri)
                                    .map(catalog.url()::resolve);

                    return new UnitFrame()

                                    .generated(true)

                            .id(Units.UNITS.id().resolve(University.uuid(University.PAVIA, url
                                            .map(URI::toString)
                                            .or(() -> json.get("name").string())
                                            .orElse(null) // !!! don't generate if missing
                                    )))

                                    .generated(true)
                            .university(University.PAVIA)
                            .unitOf(set(University.PAVIA))

                                    .altLabel(json.get("acronym").string()
                                            .map(acronym -> map(entry(ROOT, acronym)))
                                            .orElse(null)
                                    )

                                    .prefLabel(json.get("name").string()
                                            .flatMap(name -> locale(json.get("language").string())
                                                    .map(locale -> map(entry(locale, name)))
                                            )
                                            .orElse(null)
                                    )

                                    .homepage(set(url
                                            .stream()
                                    ))

                                    .classification(set(catalog.classification()));
                        }

                );
    }

    private UnitFrame details(final UnitFrame unit) {
        return unit.homepage().stream().findFirst()

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

                .flatMap(json -> locale(json.get("language").string()).map(locale -> unit

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

                ))

                .orElse(unit);
    }


}
