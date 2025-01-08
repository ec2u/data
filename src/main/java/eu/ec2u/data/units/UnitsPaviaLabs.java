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

import com.metreeca.http.actions.GET;
import com.metreeca.http.json.JSONPath;
import com.metreeca.http.json.services.Analyzer;
import com.metreeca.http.rdf4j.actions.TupleQuery;
import com.metreeca.http.work.Xtream;
import com.metreeca.http.xml.XPath;
import com.metreeca.http.xml.actions.Crawl;
import com.metreeca.http.xml.actions.Untag;
import com.metreeca.http.xml.formats.HTML;
import com.metreeca.link.Frame;

import eu.ec2u.data.EC2U;
import eu.ec2u.data.concepts.OrganizationTypes;
import eu.ec2u.data.universities.University;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.vocabulary.DCTERMS;
import org.eclipse.rdf4j.model.vocabulary.FOAF;
import org.eclipse.rdf4j.model.vocabulary.ORG;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.query.BindingSet;

import java.net.URI;
import java.util.List;
import java.util.Map.Entry;
import java.util.Optional;

import static com.metreeca.http.Locator.service;
import static com.metreeca.http.json.services.Analyzer.analyzer;
import static com.metreeca.link.Frame.*;

import static eu.ec2u.data.Data.exec;
import static eu.ec2u.data.EC2U.item;
import static eu.ec2u.data.resources.Resources.university;
import static eu.ec2u.data.universities.University.Pavia;
import static eu.ec2u.work.SPARQL.sparql;
import static java.util.Map.entry;
import static java.util.stream.Collectors.joining;

public final class UnitsPaviaLabs implements Runnable {

    private static final IRI Context=iri(Units.Context, "/pavia/units/labs");


    public static void main(final String... args) {
        exec(() -> new UnitsPaviaLabs().run());
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private final Analyzer analyzer=service(analyzer());


    @Override public void run() {
        final Xtream<Object> pages=departments()

                .map(bindings -> bindings.getValue("home").stringValue())

                .skip(15) // !!!
                .limit(1) // !!!

                .flatMap(this::pages)
                .map(Entry::getValue) // !!!
                // .flatMap(this::units)

                ;

        pages.forEach(System.out::println);

        // final Xtream<Frame> home=pages
        //
        //         .map(this::unit);


        // update(connection -> home // !!!
        //
        //         .flatMap(Frame::stream)
        //         .batch(0)
        //
        //         .map(model -> translate("en", model))
        //
        //         .forEach(new Upload()
        //                 .contexts(Context)
        //                 .clear(true)
        //         )
        // );
    }

    private static Xtream<BindingSet> departments() {
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
                );
    }


    //̸/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    private Xtream<Entry<String, String>> pages(final String home) {
        return Xtream.of(home)

                .flatMap(new Crawl())

                .optMap(url -> Optional.of(url)
                        .flatMap(new GET<>(new HTML()))
                        .map(XPath::new)
                        .flatMap(xml -> xml.string("//head/meta[@property='og:title']/@content")
                                .or(() -> xml.string("//head/title"))
                        )
                        .map(title -> entry(url, title))
                )


                .pipe(pages -> {

                    final List<Entry<String, String>> entries=pages.toList();

                    return Xtream

                            .of(entries.stream()
                                    .map(page -> "- %s".formatted(page.getValue()))
                                    .collect(joining("\n"))
                            )

                            .optMap(analyzer.prompt("""
                                    From the provided list of page titles pages from a university department website,
                                    select the title of the pages that are extremely likely to contain a list of:
                                    
                                    - research teams or groups
                                    - research laboratories
                                    - research centres
                                    
                                    Don't include single units.
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

                            .flatMap(title -> entries.stream()
                                    .filter(e -> e.getValue().equalsIgnoreCase(title))
                                    .map(Entry::getKey)
                            );

                })


                .map(page -> entry(home, page));
    }

    private Xtream<Frame> units(final Entry<String, String> entry) {
        return Xtream.of(entry.getValue())

                .optMap(new GET<>(new HTML()))
                .map(new Untag())

                .optMap(analyzer.prompt("""
                        From the provided markdown document describing a list of university research units,
                        extract the following properties:
                        
                         - acronym
                         - name
                         - URL
                         - language as guessed from name as a 2-letter ISO tag
                        
                        Omit all fields if not included in the document.
                        Respond with a JSON object.""", """
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

                .map(unit -> {

                    final URI base=URI.create(entry.getKey());
                    final String language=unit.string("language").orElse(Pavia.language);

                    return frame(

                            field(ID, item(Units.Context, University.Pavia, unit.string("url")
                                    .or(() -> unit.string("name"))
                                    .or(() -> unit.string("acronym"))
                                    .orElse("") // unexpected
                            )),

                            field(TYPE, Units.Unit),

                            field(university, Pavia.id),
                            field(ORG.UNIT_OF, item(Units.Context, Pavia, entry.getKey())),

                            field(FOAF.HOMEPAGE, unit.string("url").map(base::resolve).map(Frame::iri)),

                            field(SKOS.ALT_LABEL, unit.string("acronym").map(v -> literal(v, language))),
                            field(SKOS.PREF_LABEL, unit.string("name").map(v -> literal(v, language)))

                    );
                });
    }

    private Frame unit(final Frame unit) {
        return frame(unit, unit.value(FOAF.HOMEPAGE).flatMap(url -> Optional.of(url)

                        .map(Value::stringValue)

                        .flatMap(new GET<>(new HTML()))
                        .map(new Untag())

                        .flatMap(analyzer.prompt("""
                                From the provided markdown document describing a university research unit,
                                extract the following properties:
                                
                                - type (group, laboratory)
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
                                        "type": "string"
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
                                        case "group" -> OrganizationTypes.Group;
                                        case "laboratory" -> OrganizationTypes.Laboratory;
                                        default -> null;
                                    })),

                                    field(SKOS.DEFINITION, json.string("description").map(v -> literal(v, language))),
                                    field(DCTERMS.SUBJECT)// !!!

                            );
                        }))

                .orElseGet(Frame::frame)
        );
    }

}
