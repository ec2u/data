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

import com.metreeca.flow.actions.GET;
import com.metreeca.flow.json.JSONPath;
import com.metreeca.flow.json.services.Analyzer;
import com.metreeca.flow.rdf4j.actions.TupleQuery;
import com.metreeca.flow.rdf4j.actions.Upload;
import com.metreeca.flow.work.Xtream;
import com.metreeca.flow.xml.XPath;
import com.metreeca.flow.xml.actions.Crawl;
import com.metreeca.flow.xml.actions.Untag;
import com.metreeca.flow.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.OrganizationTypes;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.SKOS;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.metreeca.flow.Locator.service;
import static com.metreeca.flow.json.services.Analyzer.analyzer;
import static com.metreeca.flow.rdf.Values.guarded;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.EC2U.update;
import static eu.ec2u.data.units.Unit.locale;
import static eu.ec2u.data.universities.University.Pavia;
import static eu.ec2u.work.SPARQL.sparql;
import static eu.ec2u.work.xlations.Xlations.translate;
import static java.util.Map.entry;
import static java.util.stream.Collectors.joining;

public final class UnitsPaviaLabs implements Runnable {

    private static final IRI Context=iri(Units.Context, "/pavia/labs");

    private static final Map<String, IRI> UnitTypes=Map.of(
            "laboratory", OrganizationTypes.Laboratory,
            "group", OrganizationTypes.Group,
            "facility", OrganizationTypes.Facility
    );


    public static void main(final String... args) {
        exec(() -> new UnitsPaviaLabs().run());
    }


    private record Department(
            String homepage
    ) { }

    private record Page(
            Department department,
            String url,
            String title
    ) { }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override
    public void run() {
        update(connection -> departments()

                // .skip(5) // !!!
                .skip(15) // !!!
                .limit(1) // !!!

                .flatMap(this::pages)
                .flatMap(this::units)


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


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Department> departments() {
        return Xtream

                .of(sparql("""
                        prefix foaf: <http://xmlns.com/foaf/0.1/>
                        prefix ec2u: <https://data.ec2u.eu/terms/>
                        prefix org: <http://www.w3.org/ns/org#>
                        
                        select ?home {
                        
                            ?dept a org:OrganizationalUnit;
                            	ec2u:university </universities/pavia>;
                            	org:classification </concepts/organizations/university-unit/department>;
                                foaf:homepage ?home.
                        
                        }
                        """
                ))

                .flatMap(new TupleQuery()
                        .base(EC2U.BASE)
                )

                .map(bindings -> new Department(
                        bindings.getValue("home").stringValue()
                ));
    }

    private Xtream<Page> pages(final Department department) {

        final List<Page> pages=Xtream.of(department.homepage())

                .flatMap(new Crawl())

                .optMap(url -> Optional.of(url)
                        .flatMap(new GET<>(new HTML()))
                        .map(XPath::new)
                        .flatMap(xml -> xml.string("//head/meta[@property='og:title']/@content")
                                .or(() -> xml.string("//head/title"))
                        )
                        .map(title -> new Page(department, url, title))
                )

                .toList();

        return Xtream

                .of(pages.stream()
                        .map(page -> "- [%s](%s)".formatted(page.url(), page.title()))
                        .collect(joining("\n"))
                )

                .optMap(analyzer.prompt("""
                        From the provided list of page titles pages from a university department website,
                        select the title of the pages that are extremely likely to contain a directory of:
                        
                        - research teams, groups
                        - research laboratories
                        
                        Ensure titles explicitly reference lists or directories.
                        
                        Exclude titles that seem to describe individual entities unless there is clear evidence 
                        they serve as hubs for multiple units.
                        
                        Exclude lists of research centres.
                        
                        Respond with a JSON object.
                        """, """
                        {
                          "name": "pages",
                          "schema": {
                            "type": "object",
                            "properties": {
                              "titles": {
                                "type": "array",
                                "items": {
                                  "type": "string"
                                }
                              }
                            }
                          },
                          "required": [
                            "titles"
                          ]
                        }"""
                ))

                .map(JSONPath::new).flatMap(json ->
                        json.strings("titles.*")
                )

                .flatMap(title -> pages.stream()
                        .filter(page -> page.title().equalsIgnoreCase(title))
                );
    }

    private Xtream<Unit> units(final Page page) {
        return Xtream.of(page.url())

                .optMap(new GET<>(new HTML()))
                .map(new Untag())

                .optMap(analyzer.prompt("""
                        From the provided markdown document describing a list of university research units,
                        extract the following properties:
                        
                        - complete name (don't include the acronym)
                        - name language as a 2-letter ISO tag
                        - uppercase acronym (only if explicitly defined in the complete name, ignoring the URL)
                        - URL (optional)
                        - unit type (laboratory, group, facility)
                        
                        Make absolutely sure to report all units included in the list.
                        Don't include empty properties.
                        Respond with a JSON object.
                        """, """
                        {
                          "name": "units",
                          "strict": false,
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
                                    "url": {
                                      "type": "string",
                                      "format": "uri"
                                    },
                                    "language": {
                                      "type": "string"
                                    },
                                    "type": {
                                      "type": "string",
                                      "enum": [
                                        "laboratory",
                                        "group",
                                        "facility"
                                      ]
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
                        }"""
                ))

                .map(JSONPath::new).flatMap(json ->
                        json.paths("units.*")
                )

                .filter(unit -> unit.string("name").isPresent())

                .map(unit -> new Unit()

                        .setAnalyzed(true)
                        .setUniversity(Pavia)
                        .setParent(item(Units.Context, Pavia, page.department().homepage()))

                        .setAcronym(unit.string("acronym")
                                .orElse(null)
                        )

                        .setName(unit.string("name")
                                .flatMap(name -> locale(unit, "language")
                                        .map(locale -> entry(name, locale))
                                )
                                .orElse(null)
                        )

                        .setUrl(unit.string("url")
                                .map(guarded(URI::create))
                                .map(v -> URI.create(page.url()).resolve(v)) // !!!
                                .orElse(null)
                        )

                        .setClassification(unit.string("type")
                                .map(UnitTypes::get)
                                .orElse(null)
                        )

                );
    }

    private Frame unit(final Frame unit) {
        return frame(unit, unit.value(FOAF.HOMEPAGE).flatMap(url -> Optional.of(url)

                        .map(Value::stringValue)

                        .flatMap(new GET<>(new HTML()))
                        .map(new Untag())

                        .flatMap(analyzer.prompt("""
                                From the provided markdown document describing a university research unit,
                                extract the following properties:
                                
                                - type (laboratory, group, facility)
                                - summary of about 500 characters
                                - extensive description as included in the document
                                - outline of the unit activities and facilities
                                - document language as a 2-letter ISO tag
                                
                                Respond in the document original language.
                                Respond with a JSON object.""", """
                                {
                                  "name": "unit",
                                  "schema": {
                                    "type": "object",
                                    "properties": {
                                      "type": {
                                        "type": "string",
                                        "enum": [
                                          "laboratory",
                                          "group",
                                          "facility"
                                        ]
                                      },
                                      "summary": {
                                        "type": "string"
                                      },
                                      "description": {
                                        "type": "string"
                                      },
                                      "outline": {
                                        "type": "string"
                                      },
                                      "language": {
                                        "type": "string",
                                        "pattern": "^[a-zA-Z]{2}$"
                                      }
                                    },
                                    "required": [
                                      "summary",
                                      "description",
                                      "language"
                                    ]
                                  }
                                }"""
                        ))

                        .map(JSONPath::new).map(json -> {

                            final String language=json.string("language").orElse(Pavia.language);

                            return frame(

                                    field(ID, item(Units.Context, Pavia, url.stringValue())),

                                    field(ORG.CLASSIFICATION, json.string("type").map(type -> switch ( type ) {
                                        case "laboratory" -> OrganizationTypes.Laboratory;
                                        case "group" -> OrganizationTypes.Group;
                                        case "facility" -> OrganizationTypes.Facility;
                                        default -> null;
                                    })),

                                    field(SKOS.DEFINITION, json.string("description").map(v -> literal(v, language))),
                                    field(DCTERMS.SUBJECT) // !!!

                            );
                        }))

                .orElseGet(Frame::frame)
        );
    }

}
