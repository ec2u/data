/*
 * Copyright © 2020-2024 EC2U Alliance
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

import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.services.Analyzer;
import com.metreeca.http.rdf4j.actions.Upload;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.concepts.OrganizationTypes;
import org.eclipse.rdf4j.model.IRI;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.json.services.Analyzer.analyzer;
import static com.metreeca.http.rdf.Values.guarded;
import static com.metreeca.link.Frame.iri;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.universities.University.Pavia;
import static eu.ec2u.work.xlations.Xlations.translate;
import static java.util.Map.entry;

public final class UnitsPavia implements Runnable {

    private static final IRI Context=iri(Units.Context, "/pavia");


    //// !!! Factor ////////////////////////////////////////////////////////////////////////////////////////////////////

    private static final Pattern LanguagePattern=Pattern.compile("[a-zA-Z]{2}");

    private static Optional<Locale> locale(final JSONPath json, final String language) {
        return json.string(language)
                .filter(LanguagePattern.asMatchPredicate())
                .map(guarded(Locale::forLanguageTag));
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    public static void main(final String... args) {
        exec(() -> new UnitsPavia().run());
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        update(connection -> Xtream

                .of(
                        new Catalog(
                                "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/dipartimenti",
                                OrganizationTypes.Department
                        ),
                        new Catalog(
                                "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-servizio-dateneo",
                                OrganizationTypes.CentreService
                        ),
                        new Catalog(
                                "https://portale.unipv.it/it/ricerca/strutture-di-ricerca/centri-di-ricerca/centri-di-ricerca-interdipartimentali",
                                OrganizationTypes.CentreResearchInterdepartmental
                        )
                )

                .flatMap(this::catalog)
                .map(this::details)

                .optMap(Unit::toFrame)
                .flatMap(Frame::stream)
                .batch(0)

                .map(model -> translate("en", model))

                .forEach(new Upload()
                        .contexts(Context)
                        .clear(true)
                )
        );
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Unit> catalog(final Catalog catalog) {
        return Xtream.of(catalog.url.toASCIIString())

                .optMap(new GET<>(new HTML()))
                .map(new Untag())

                .optMap(analyzer.prompt("""
                        Extract the following properties from the provided markdown document describing
                        a list of university research units:

                        - acronym (don't include if not explicitly defined in the document)
                        - name (don't include acronym)
                        - name language as a 2-letter ISO tag
                        - URL

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

                .map(JSONPath::new).flatMap(json -> json.paths("units.*")).map(json -> new Unit()

                        .setUniversity(Pavia)

                        .setAcronym(json.string("acronym")
                                .orElse(null)
                        )

                        .setName(json.string("name").flatMap(name -> locale(json, "language")
                                                .map(locale -> entry(name, locale))
                                        )
                                        .orElse(null)
                        )

                        .setUrl(json.string("url")
                                .map(guarded(URI::create))
                                .map(catalog.url::resolve)
                                .orElse(null)
                        )

                        .setClassification(catalog.classification)

                );
    }

    private Unit details(final Unit unit) {

        return Optional.ofNullable(unit.getUrl())

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

                .map(JSONPath::new).flatMap(json -> locale(json, "language").map(locale -> unit

                        .setAcronym(Optional.ofNullable(unit.getAcronym())
                                .or(() -> json.string("acronym"))
                                .orElse(null)
                        )

                        .setSummary(json.string("summary")
                                .map(summary -> entry(summary, locale))
                                .orElse(null)
                        )

                        .setDescription(json.string("description")
                                .map(summary -> entry(summary, locale))
                                .orElse(null)
                        )

                ))

                .orElse(unit);
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private record Catalog(
            URI url,
            IRI classification
    ) {

        private Catalog(final String url, final IRI classification) {
            this(URI.create(url), classification);
        }

    }

}
